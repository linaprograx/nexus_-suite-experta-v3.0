import { Firestore, writeBatch, DocumentReference } from 'firebase/firestore';

/**
 * Escritura troceada en lotes de Firestore.
 *
 * ## Por qué existe
 *
 * Un `writeBatch` admite **500 operaciones como máximo**, y al pasarse no
 * escribe de más ni de menos: **rechaza el lote entero**. Con un catálogo de
 * 1.380 referencias, importar el CSV no fallaba a medias — no hacía nada, y el
 * error que llegaba («maximum 500 writes allowed per request») no decía que el
 * problema fuese el tamaño.
 *
 * ## Lo que cambia al trocear, y hay que decirlo
 *
 * Un lote es atómico; varios lotes no. Al partir en trozos, un fallo a mitad
 * **sí** deja parte escrita, que antes no podía pasar. Por eso `cerrar()`
 * informa siempre de cuántas operaciones llegaron a confirmarse, y si algo
 * falla el error lo lleva dentro: sin ese número, quien importa no puede saber
 * si repetir la operación duplicará lo ya escrito.
 *
 * ## Por qué 450 y no 500
 *
 * Margen. Alguna operación futura puede contar doble, y quedarse a las puertas
 * del límite por ahorrar cincuenta escrituras no compensa.
 */

export interface ResultadoLotes {
    /** Operaciones confirmadas. */
    escritas: number;
    /** Cuántos lotes hicieron falta. */
    lotes: number;
}

export class FalloEnLotes extends Error {
    constructor(public readonly escritas: number, public readonly causa: unknown) {
        super(
            escritas > 0
                ? `La escritura falló después de guardar ${escritas} registros. Los ya guardados siguen ahí: `
                  + 'si repites la operación, revisa antes lo que entró para no duplicarlo.'
                : 'La escritura falló y no se guardó nada.',
        );
        this.name = 'FalloEnLotes';
    }
}

const LIMITE_POR_LOTE = 450;

export class EscrituraPorLotes {
    private lote;
    private pendientes = 0;
    private escritas = 0;
    private lotes = 0;

    constructor(private readonly db: Firestore, private readonly limite = LIMITE_POR_LOTE) {
        this.lote = writeBatch(db);
    }

    /** Operaciones acumuladas y aún sin confirmar. */
    get enCola() { return this.pendientes; }

    set(ref: DocumentReference, datos: any) {
        this.lote.set(ref, datos);
        return this.anotar();
    }

    update(ref: DocumentReference, datos: any) {
        this.lote.update(ref, datos);
        return this.anotar();
    }

    private anotar() {
        this.pendientes++;
        // Se confirma AL LLEGAR al límite, no al pasarse: pasarse es
        // exactamente lo que rompe el lote.
        return this.pendientes >= this.limite ? this.confirmar() : Promise.resolve();
    }

    private async confirmar() {
        if (this.pendientes === 0) return;
        const cuantas = this.pendientes;
        try {
            await this.lote.commit();
        } catch (e) {
            throw new FalloEnLotes(this.escritas, e);
        }
        this.escritas += cuantas;
        this.lotes++;
        this.pendientes = 0;
        this.lote = writeBatch(this.db);
    }

    /** Confirma lo que quede. Hay que llamarlo siempre al terminar. */
    async cerrar(): Promise<ResultadoLotes> {
        await this.confirmar();
        return { escritas: this.escritas, lotes: this.lotes };
    }
}
