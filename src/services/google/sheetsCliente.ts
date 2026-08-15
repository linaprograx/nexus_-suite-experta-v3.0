import { Auth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { HojaCarta, CABECERAS } from '../../core/export/cartaASheet';

/**
 * Crea la carta como hoja de cálculo en el Drive del usuario.
 *
 * ## El permiso que se pide, y por qué ese
 *
 * `drive.file`, **no** `spreadsheets` ni `drive` a secas. Los tres sirven para
 * crear una hoja, pero `drive.file` solo da acceso a **los ficheros que crea
 * esta app**: Nexus no puede leer, listar ni tocar nada más del Drive del
 * usuario. Pedir menos de lo que se puede pedir es la diferencia entre una
 * integración y una intrusión.
 *
 * El permiso se pide **en el momento de exportar**, no al entrar. Nadie tiene
 * que conceder acceso a su Drive para usar la app; solo quien pulse el botón.
 *
 * ## Lo que hace falta en la consola de Google, y no lo puede hacer el código
 *
 * En el proyecto de Google Cloud hay que **habilitar la API de Google Sheets** y
 * declarar el ámbito `drive.file` en la pantalla de consentimiento. Sin eso,
 * esto devolverá un error de permiso por muy bien escrito que esté.
 */

const AMBITO = 'https://www.googleapis.com/auth/drive.file';

export class ErrorSheets extends Error {
    constructor(mensaje: string, public readonly causa?: unknown) {
        super(mensaje);
        this.name = 'ErrorSheets';
    }
}

/**
 * Pide permiso y devuelve el token.
 *
 * Es un `signInWithPopup` aunque el usuario ya esté dentro: es la forma de
 * pedir un ámbito nuevo, y Google solo entrega el token de acceso en ese
 * momento. No se guarda en ningún sitio —caduca en una hora— así que cada
 * exportación vuelve a pedirlo; a cambio, no hay un token de Drive durmiendo
 * en el navegador.
 */
export const pedirPermisoDrive = async (auth: Auth): Promise<string> => {
    const proveedor = new GoogleAuthProvider();
    proveedor.addScope(AMBITO);
    // Sin esto, Google reutiliza la sesión y puede no devolver el token nuevo.
    proveedor.setCustomParameters({ prompt: 'consent' });

    let resultado;
    try {
        resultado = await signInWithPopup(auth, proveedor);
    } catch (e: any) {
        if (e?.code === 'auth/popup-blocked') {
            throw new ErrorSheets('El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio e inténtalo otra vez.', e);
        }
        if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
            throw new ErrorSheets('Se cerró la ventana de Google sin dar permiso.', e);
        }
        throw new ErrorSheets('No se pudo pedir permiso a Google.', e);
    }

    const token = GoogleAuthProvider.credentialFromResult(resultado)?.accessToken;
    if (!token) {
        throw new ErrorSheets('Google no devolvió un permiso de acceso a Drive. Comprueba que el ámbito está declarado en la pantalla de consentimiento del proyecto.');
    }
    return token;
};

const api = async (token: string, url: string, cuerpo?: any, metodo = 'POST') => {
    const r = await fetch(url, {
        method: metodo,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
    });
    if (!r.ok) {
        const detalle = await r.text().catch(() => '');
        // 403 casi siempre es la API sin habilitar, no un fallo del código: se
        // dice, porque el mensaje de Google no lo deja claro.
        if (r.status === 403) {
            throw new ErrorSheets('Google ha denegado la operación. Lo más habitual es que la API de Google Sheets no esté habilitada en el proyecto.', detalle);
        }
        throw new ErrorSheets(`Google respondió ${r.status}.`, detalle);
    }
    return r.json();
};

const rgb = (hex: string) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return { red: ((n >> 16) & 255) / 255, green: ((n >> 8) & 255) / 255, blue: (n & 255) / 255 };
};

/** Crea la hoja, escribe los valores y aplica el formato. Devuelve su URL. */
export const exportarCartaASheets = async (auth: Auth, hoja: HojaCarta): Promise<string> => {
    const token = await pedirPermisoDrive(auth);

    const creada = await api(token, 'https://sheets.googleapis.com/v4/spreadsheets', {
        properties: { title: hoja.titulo },
        sheets: [{
            properties: {
                title: 'Carta',
                gridProperties: {
                    rowCount: Math.max(hoja.lineas.length + 20, 60),
                    columnCount: CABECERAS.length,
                    // La portada se queda fija al desplazarse.
                    frozenRowCount: hoja.filasDePortada,
                },
            },
        }],
    });

    const idHoja: string = creada.spreadsheetId;
    const idPestana: number = creada.sheets[0].properties.sheetId;
    const url: string = creada.spreadsheetUrl;

    // Los valores. `USER_ENTERED` y no `RAW`: sin eso, las fórmulas de
    // SPARKLINE entrarían como texto y se verían escritas en la celda.
    const filas = hoja.lineas.map(l => {
        const c = [...l.celdas];
        while (c.length < CABECERAS.length) c.push('');
        return c;
    });
    await api(
        token,
        `https://sheets.googleapis.com/v4/spreadsheets/${idHoja}/values/Carta!A1?valueInputOption=USER_ENTERED`,
        { values: filas },
        'PUT',
    );

    const acento = rgb(hoja.acento);
    const peticiones: any[] = [];

    // La portada: una sola celda de lado a lado, con fondo y tipografía grande.
    peticiones.push({
        mergeCells: {
            range: { sheetId: idPestana, startRowIndex: 0, endRowIndex: hoja.filasDePortada, startColumnIndex: 0, endColumnIndex: CABECERAS.length },
            mergeType: 'MERGE_ALL',
        },
    });
    peticiones.push({
        repeatCell: {
            range: { sheetId: idPestana, startRowIndex: 0, endRowIndex: hoja.filasDePortada },
            cell: {
                userEnteredFormat: {
                    backgroundColor: acento,
                    horizontalAlignment: 'LEFT',
                    verticalAlignment: 'MIDDLE',
                    padding: { left: 18, top: 10, bottom: 10 },
                    textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 26, bold: true },
                },
            },
            fields: 'userEnteredFormat',
        },
    });

    // Anchos: una hoja sin anchos llega ilegible, con los ingredientes cortados.
    hoja.anchos.forEach((px, i) => {
        peticiones.push({
            updateDimensionProperties: {
                range: { sheetId: idPestana, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
                properties: { pixelSize: px },
                fields: 'pixelSize',
            },
        });
    });

    // Secciones y cabeceras, cada una con su formato.
    hoja.lineas.forEach((l, i) => {
        if (l.tipo === 'seccion') {
            peticiones.push({
                mergeCells: { range: { sheetId: idPestana, startRowIndex: i, endRowIndex: i + 1, startColumnIndex: 0, endColumnIndex: CABECERAS.length }, mergeType: 'MERGE_ALL' },
            });
            peticiones.push({
                repeatCell: {
                    range: { sheetId: idPestana, startRowIndex: i, endRowIndex: i + 1 },
                    cell: { userEnteredFormat: { backgroundColor: acento, textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 11 } } },
                    fields: 'userEnteredFormat',
                },
            });
        }
        if (l.tipo === 'cabecera') {
            peticiones.push({
                repeatCell: {
                    range: { sheetId: idPestana, startRowIndex: i, endRowIndex: i + 1 },
                    cell: { userEnteredFormat: { backgroundColor: { red: 0.90, green: 0.96, blue: 0.94 }, textFormat: { bold: true, fontSize: 10 } } },
                    fields: 'userEnteredFormat',
                },
            });
        }
    });

    // Euros en PVP y coste. Van como número, así que se pueden sumar; el
    // formato solo decide cómo se ven.
    peticiones.push({
        repeatCell: {
            range: { sheetId: idPestana, startRowIndex: hoja.filasDePortada, startColumnIndex: 3, endColumnIndex: 5 },
            cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '€#,##0.00' }, horizontalAlignment: 'RIGHT' } },
            fields: 'userEnteredFormat(numberFormat,horizontalAlignment)',
        },
    });

    // Que el texto largo no se coma la fila de al lado.
    peticiones.push({
        repeatCell: {
            range: { sheetId: idPestana, startRowIndex: hoja.filasDePortada, startColumnIndex: 1, endColumnIndex: 3 },
            cell: { userEnteredFormat: { wrapStrategy: 'WRAP', verticalAlignment: 'TOP' } },
            fields: 'userEnteredFormat(wrapStrategy,verticalAlignment)',
        },
    });

    await api(token, `https://sheets.googleapis.com/v4/spreadsheets/${idHoja}:batchUpdate`, { requests: peticiones });

    return url;
};
