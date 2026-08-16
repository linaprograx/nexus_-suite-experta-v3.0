import { Auth, GoogleAuthProvider, signInWithPopup, reauthenticateWithPopup } from 'firebase/auth';
import { HojaCarta, CABECERAS } from '../../core/export/cartaASheet';
import { LibroEscandallo } from '../../core/export/libroEscandallos';

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

/**
 * Si Nexus se está ejecutando como **app instalada** (standalone).
 *
 * Importa porque decide si el permiso de Google se puede pedir siquiera.
 * `signInWithPopup` abre `…/__/auth/handler?authType=signInViaPopup`, y esa
 * página no navega a ninguna parte: su único trabajo es cargarse y devolverle
 * el resultado a **la ventana que la abrió**, por `window.opener`.
 *
 * Dentro de una app instalada, el sistema manda ese enlace al navegador
 * **como aplicación aparte**, sin vínculo con quien lo abrió. Así que la página
 * carga, busca a su llamante, no lo encuentra, y se queda esperando para
 * siempre. No falla: espera una respuesta que no puede llegar.
 *
 * No es configuración de Google ni del proyecto. Es que el flujo de ventana
 * emergente **no puede funcionar** ahí dentro, por diseño.
 *
 * El arreglo de raíz es servir `/__/auth/*` desde el propio dominio en vez de
 * desde `firebaseapp.com`, y usar redirección. Toca el arranque de sesión de
 * todo el mundo, así que va aparte y con su verificación.
 */
export const esAppInstalada = (): boolean => {
    if (typeof window === 'undefined') return false;
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches === true;
    const iosStandalone = (window.navigator as any)?.standalone === true;
    return standalone || iosStandalone;
};

export class ErrorSheets extends Error {
    constructor(mensaje: string, public readonly causa?: unknown) {
        super(mensaje);
        this.name = 'ErrorSheets';
    }
}

/**
 * Traducción de los errores de Firebase que pueden salir aquí, **con el código
 * siempre a la vista**.
 *
 * La primera versión los resumía todos en «No se pudo pedir permiso a Google»,
 * y eso es exactamente lo que no hay que hacer: se tragaba el único dato que
 * permite arreglarlo. Un mensaje que no se puede accionar no es un mensaje.
 */
const explicarErrorDeAuth = (e: any): string => {
    const codigo = e?.code || 'sin-codigo';
    const detalle = e?.message ? ` · ${e.message}` : '';

    switch (codigo) {
        case 'auth/popup-blocked':
            return 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio e inténtalo otra vez.';
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return 'Se cerró la ventana de Google sin dar permiso.';
        case 'auth/unauthorized-domain': {
            // El dominio EXACTO, para poder copiarlo. Decir «añade el dominio»
            // sin decir cuál obliga a adivinar, y en Vercel conviven la url de
            // producción, las de rama y las de cada despliegue: no da igual.
            const dominio = typeof window !== 'undefined' ? window.location.hostname : '(desconocido)';
            return `El dominio «${dominio}» no está autorizado en Firebase. `
                + `Añádelo tal cual en Firebase Console → Authentication → Settings → Authorized domains. [${codigo}]`;
        }
        case 'auth/user-mismatch':
            return `Has elegido una cuenta de Google distinta a la que tienes abierta en Nexus. Entra con la misma. [${codigo}]`;
        case 'auth/operation-not-supported-in-this-environment':
            return `Este navegador no admite el flujo de ventana emergente. Prueba en Safari o Chrome normales, sin modo privado. [${codigo}]`;
        case 'auth/internal-error':
            return `Google devolvió un error interno. Suele ser la API de Sheets sin habilitar, o el ámbito sin declarar en la pantalla de consentimiento. [${codigo}]${detalle}`;
        case 'auth/admin-restricted-operation':
            return `La cuenta tiene restringida esta operación. Si el proyecto está en modo Prueba, añádete en Usuarios de prueba. [${codigo}]`;
        default:
            // El código, literal. Es lo que hace falta para arreglarlo.
            return `Google rechazó la petición de permiso. [${codigo}]${detalle}`;
    }
};

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
    // Se comprueba ANTES de abrir nada: abrir una ventana que va a quedarse
    // cargando para siempre es peor que no abrirla, porque parece que funciona.
    if (esAppInstalada()) {
        throw new ErrorSheets(
            'Desde la app instalada, Google no puede devolver el permiso: abre la ventana en el navegador '
            + 'del móvil, como aplicación aparte, y desde ahí no hay forma de contestarle a Nexus. '
            + 'Haz esta exportación desde el navegador.',
        );
    }

    const proveedor = new GoogleAuthProvider();
    proveedor.addScope(AMBITO);
    // Sin esto, Google reutiliza la sesión y puede no devolver el token nuevo.
    proveedor.setCustomParameters({ prompt: 'consent' });

    /**
     * Con el usuario ya dentro se **reautentica**, no se vuelve a entrar.
     *
     * `signInWithPopup` inicia una sesión nueva: es la herramienta de «entrar»,
     * y aquí ya se ha entrado. Lo que se quiere es añadirle un permiso al
     * usuario que hay, que es literalmente lo que hace
     * `reauthenticateWithPopup` — y devuelve la misma credencial con el token,
     * sin tocar la sesión. Se deja `signInWithPopup` solo para el caso de que
     * no haya nadie dentro, donde sí es lo correcto.
     */
    const usuario = auth.currentUser;

    let resultado;
    try {
        resultado = usuario
            ? await reauthenticateWithPopup(usuario, proveedor)
            : await signInWithPopup(auth, proveedor);
    } catch (e: any) {
        // El código, siempre en la consola: el mensaje de pantalla es para el
        // usuario, esto es para poder arreglarlo.
        console.error('[Sheets] permiso rechazado', e?.code, e);
        throw new ErrorSheets(explicarErrorDeAuth(e), e);
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
        // `locale` explícito: sin él Google crea el libro en en_US, donde el
        // separador de argumentos es la coma, y las fórmulas SPARKLINE de más
        // abajo —escritas con «;»— entrarían como TEXTO, en silencio.
        properties: { title: hoja.titulo, locale: 'es_ES' },
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

/**
 * Sube un **libro de escandallos**: portada, una pestaña por cóctel y Materia
 * Prima, con las fórmulas vivas que las enlazan.
 *
 * ## El idioma de las fórmulas
 *
 * El libro se crea con `locale: 'es_ES'`. Sin fijarlo, Google lo crea en
 * `en_US`, donde el separador de argumentos es la coma — y **todas las
 * fórmulas entrarían como texto**, en silencio. Un libro entero de celdas que
 * enseñan su propia fórmula en vez de su resultado.
 */
export const exportarLibroASheets = async (auth: Auth, libro: LibroEscandallo): Promise<string> => {
    const token = await pedirPermisoDrive(auth);

    const creada = await api(token, 'https://sheets.googleapis.com/v4/spreadsheets', {
        properties: { title: libro.titulo, locale: 'es_ES' },
        sheets: libro.hojas.map((h, i) => ({
            properties: {
                sheetId: i,
                index: i,
                title: h.titulo,
                gridProperties: {
                    rowCount: Math.max(h.valores.length + 20, 60),
                    columnCount: Math.max(h.anchos.length + 2, 8),
                    ...(h.filaCongelada ? { frozenRowCount: h.filaCongelada } : {}),
                    // Sin cuadrícula, como la plantilla: los bloques se leen por
                    // sus marcos, y las líneas grises de fondo los ensucian.
                    ...(h.ocultarCuadricula ? { hideGridlines: true } : {}),
                },
            },
        })),
    });

    const idHoja: string = creada.spreadsheetId;
    const url: string = creada.spreadsheetUrl;

    // Los valores de todas las pestañas, en una sola llamada. `USER_ENTERED`
    // para que las fórmulas entren como fórmulas y no como texto.
    await api(
        token,
        `https://sheets.googleapis.com/v4/spreadsheets/${idHoja}/values:batchUpdate`,
        {
            valueInputOption: 'USER_ENTERED',
            data: libro.hojas.map(h => ({
                range: `'${h.titulo.replace(/'/g, "''")}'!A1`,
                values: h.valores.map(fila => {
                    const f = [...fila];
                    while (f.length < h.anchos.length) f.push('');
                    return f;
                }),
            })),
        },
        'POST',
    );

    const peticiones: any[] = [];

    libro.hojas.forEach((h, sheetId) => {
        // La marca, en A1 y en gris: Sheets no tiene marcas de agua de verdad,
        // así que es una celda. Decirlo es mejor que fingir que es otra cosa.
        peticiones.push({
            repeatCell: {
                range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
                cell: { userEnteredFormat: { textFormat: { foregroundColor: rgb('#cbd5e1'), bold: true, fontSize: 9 } } },
                fields: 'userEnteredFormat.textFormat',
            },
        });

        h.anchos.forEach((px, i) => {
            peticiones.push({
                updateDimensionProperties: {
                    range: { sheetId, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
                    properties: { pixelSize: px },
                    fields: 'pixelSize',
                },
            });
        });

        for (const b of h.bandas) {
            const rango = {
                sheetId,
                startRowIndex: b.fila,
                endRowIndex: b.fila + (b.filas || 1),
                startColumnIndex: b.col || 0,
                endColumnIndex: (b.col || 0) + (b.cols || h.anchos.length),
            };
            if (b.combinar) peticiones.push({ mergeCells: { range: rango, mergeType: 'MERGE_ALL' } });
            peticiones.push({
                repeatCell: {
                    range: rango,
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: rgb(b.color),
                            verticalAlignment: 'MIDDLE',
                            wrapStrategy: 'WRAP',
                            textFormat: {
                                bold: b.negrita !== false,
                                fontSize: b.tamano || 10,
                                ...(b.textoBlanco ? { foregroundColor: { red: 1, green: 1, blue: 1 } } : {}),
                            },
                        },
                    },
                    fields: 'userEnteredFormat(backgroundColor,verticalAlignment,textFormat,wrapStrategy)',
                },
            });
        }

        const formato = (rangos: typeof h.moneda, patron: string, tipo: string) => {
            for (const r of rangos) {
                peticiones.push({
                    repeatCell: {
                        range: {
                            sheetId,
                            startRowIndex: r.fila, endRowIndex: r.fila + r.filas,
                            startColumnIndex: r.col, endColumnIndex: r.col + r.cols,
                        },
                        cell: { userEnteredFormat: { numberFormat: { type: tipo, pattern: patron }, horizontalAlignment: 'RIGHT' } },
                        fields: 'userEnteredFormat(numberFormat,horizontalAlignment)',
                    },
                });
            }
        };
        formato(h.moneda, '€#,##0.00', 'CURRENCY');
        formato(h.porcentaje, '0.0%', 'PERCENT');

        // Los marcos de cada bloque. Es lo que da a la plantilla su aspecto de
        // ficha y no de listado: cada cosa dentro de su recuadro.
        for (const b of (h.bordes || [])) {
            const linea = { style: 'SOLID', color: rgb('#9DB0D4') };
            peticiones.push({
                updateBorders: {
                    range: {
                        sheetId,
                        startRowIndex: b.fila, endRowIndex: b.fila + b.filas,
                        startColumnIndex: b.col, endColumnIndex: b.col + b.cols,
                    },
                    top: linea, bottom: linea, left: linea, right: linea,
                    ...(b.interior ? { innerHorizontal: linea, innerVertical: linea } : {}),
                },
            });
        }

        for (const a of (h.alturas || [])) {
            peticiones.push({
                updateDimensionProperties: {
                    range: { sheetId, dimension: 'ROWS', startIndex: a.fila, endIndex: a.fila + 1 },
                    properties: { pixelSize: a.px },
                    fields: 'pixelSize',
                },
            });
        }

        for (const c of (h.centradas || [])) {
            peticiones.push({
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: c.fila, endRowIndex: c.fila + c.filas,
                        startColumnIndex: c.col, endColumnIndex: c.col + c.cols,
                    },
                    cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
                    fields: 'userEnteredFormat.horizontalAlignment',
                },
            });
        }

        /**
         * Las zonas bloqueadas de la plantilla del fundador.
         *
         * En una hoja viva, escribir un número encima de una fórmula la destruye
         * sin avisar, y a partir de ahí esa celda miente para siempre — y encima
         * parece que funciona. Se protege lo calculado; lo que se toca a mano
         * —el PVP, las cantidades, los precios de Materia Prima— queda abierto.
         *
         * `warningOnly`: avisa y deja seguir. Bloquear del todo obligaría a
         * gestionar permisos de una hoja que es del propio usuario, y él es el
         * dueño: el objetivo es que no lo haga sin darse cuenta, no impedírselo.
         */
        for (const p of (h.protegidos || [])) {
            peticiones.push({
                addProtectedRange: {
                    protectedRange: {
                        range: {
                            sheetId,
                            startRowIndex: p.fila, endRowIndex: p.fila + p.filas,
                            startColumnIndex: p.col, endColumnIndex: p.col + p.cols,
                        },
                        description: p.motivo,
                        warningOnly: true,
                    },
                },
            });
        }

        // El pastel 3D de la plantilla del fundador: coste contra beneficio.
        // Aquí sí procede que sea un objeto flotante — en una ficha por pestaña
        // no hay nada que ordenar que pueda descolocarlo.
        if (h.grafico) {
            const g = h.grafico;
            peticiones.push({
                addChart: {
                    chart: {
                        spec: {
                            title: 'Coste / Beneficio',
                            pieChart: {
                                legendPosition: 'BOTTOM_LEGEND',
                                threeDimensional: true,
                                pieHole: 0,
                                domain: { sourceRange: { sources: [{ sheetId, startRowIndex: g.filaDatos, endRowIndex: g.filaDatos + 2, startColumnIndex: g.colDatos, endColumnIndex: g.colDatos + 1 }] } },
                                series: { sourceRange: { sources: [{ sheetId, startRowIndex: g.filaDatos, endRowIndex: g.filaDatos + 2, startColumnIndex: g.colDatos + 1, endColumnIndex: g.colDatos + 2 }] } },
                            },
                        },
                        position: {
                            overlayPosition: {
                                anchorCell: { sheetId, rowIndex: g.anclaFila, columnIndex: g.anclaCol },
                                widthPixels: 330, heightPixels: 210,
                                offsetXPixels: 8, offsetYPixels: 4,
                            },
                        },
                    },
                },
            });
        }
    });

    // Se trocea: una petición con centenares de bloques puede pasarse del
    // tamaño admitido, y entonces no entra NADA. Ver `escrituraPorLotes.ts`.
    const TAMANO = 120;
    for (let i = 0; i < peticiones.length; i += TAMANO) {
        await api(token, `https://sheets.googleapis.com/v4/spreadsheets/${idHoja}:batchUpdate`, {
            requests: peticiones.slice(i, i + TAMANO),
        });
    }

    return url;
};
