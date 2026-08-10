import React from 'react';
import { Firestore, addDoc, collection } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { resolveStandardPack } from '../../utils/packNormalization';
import { calculateIngredientPrice } from '../../utils/costCalculator';

/**
 * Alta exprés de un ingrediente **sin salir de la receta**.
 *
 * El caso que resuelve: estás montando una margarita, buscas «tequila» y no
 * existe en el catálogo. Hasta ahora había que abandonar la receta, ir a
 * Mercado, crearlo con todos sus campos y volver — o peor, cambiar la receta
 * para usar lo que sí había. Diseñar una carta no puede depender de que el
 * catálogo esté completo.
 *
 * Lo que se crea aquí queda marcado con `pendienteRevision`: son ingredientes
 * **hipotéticos**, con datos aproximados, que sirven para cerrar la receta hoy
 * y completarse cuando toque. La marca es lo que impide que se confundan con
 * catálogo real: sin ella, un precio inventado se propagaría al escandallo sin
 * que nadie supiera que era una estimación.
 */
export const QuickIngredientModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    db: Firestore;
    userId: string;
    appId: string;
    /** Lo que el usuario había escrito en el buscador. */
    nombreInicial: string;
    suppliers: Array<{ id: string; name: string }>;
    /** Recibe el id del ingrediente recién creado para engancharlo a la línea. */
    onCreado: (ingredientId: string, nombre: string) => void;
}> = ({ isOpen, onClose, db, userId, appId, nombreInicial, suppliers, onCreado }) => {
    const [nombre, setNombre] = React.useState(nombreInicial);
    const [precio, setPrecio] = React.useState('');
    const [unidadCompra, setUnidadCompra] = React.useState('0.700 L');
    const [proveedor, setProveedor] = React.useState('');
    const queryClient = useQueryClient();
    const [guardando, setGuardando] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setNombre(nombreInicial);
            setPrecio('');
            setUnidadCompra('0.700 L');
            setProveedor('');
            setError(null);
        }
    }, [isOpen, nombreInicial]);

    const guardar = async () => {
        const limpio = nombre.trim();
        if (!limpio || guardando) return;
        setGuardando(true);
        setError(null);
        try {
            const precioCompra = parseFloat(precio.replace(',', '.')) || 0;
            // Misma normalización que el alta completa: el ingrediente exprés
            // entra al catálogo con un formato canónico, no con texto libre.
            const { standardUnit, standardQuantity } = resolveStandardPack({
                name: limpio,
                unitText: unidadCompra,
                explicitQty: 0,
                explicitUnit: undefined,
            });

            const ref = await addDoc(collection(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`), {
                nombre: limpio,
                categoria: 'Por revisar',
                unidad: standardUnit || 'ml',
                unidadCompra,
                precioCompra,
                standardUnit,
                standardQuantity,
                standardPrice: calculateIngredientPrice(precioCompra, standardQuantity, 0),
                wastePercentage: 0,
                ...(proveedor ? { proveedor, proveedores: [proveedor] } : {}),
                // La marca que lo distingue del catálogo real.
                pendienteRevision: true,
                creadoDesde: 'receta',
                createdAt: new Date(),
            });

            // `useIngredients` es un getDocs cacheado, no un onSnapshot: sin
            // refrescar, la línea de la receta apuntaría a un id que todavía no
            // está en `allIngredients` y se vería vacía con coste 0. Se espera
            // al refetch ANTES de enganchar el id.
            await queryClient.invalidateQueries({ queryKey: ['ingredients'] });
            onCreado(ref.id, limpio);
            onClose();
        } catch (e) {
            console.error('[ALTA_EXPRES] fallo', e);
            setError('No se pudo crear. Mira la consola.');
        } finally {
            setGuardando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <span className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                        <Icon svg={ICONS.plus} className="w-5 h-5" />
                    </span>
                    <span>Ingrediente rápido</span>
                </div>
            }
            className="!max-w-md"
        >
            <div className="space-y-4 pt-1">
                <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 rounded-xl px-3 py-2 leading-relaxed">
                    Se creará marcado como <strong>pendiente de revisión</strong>: sirve para cerrar
                    la receta ahora con datos aproximados. Lo encontrarás luego en Mercado para
                    completarlo.
                </p>

                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-slate-400 font-bold tracking-wider">Nombre</Label>
                    <Input value={nombre} onChange={e => setNombre(e.target.value)} autoFocus className="h-11" />
                </div>

                <div className="flex gap-3">
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-xs uppercase text-slate-400 font-bold tracking-wider">Precio aprox.</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                            <Input
                                type="number" step="any" min="0" inputMode="decimal"
                                value={precio} onChange={e => setPrecio(e.target.value)}
                                placeholder="0.00" className="h-11 pl-8"
                            />
                        </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-xs uppercase text-slate-400 font-bold tracking-wider">Formato</Label>
                        <Input
                            value={unidadCompra} onChange={e => setUnidadCompra(e.target.value)}
                            placeholder="0.700 L" className="h-11"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-slate-400 font-bold tracking-wider">
                        Proveedor <span className="normal-case text-slate-400">(opcional)</span>
                    </Label>
                    <Select value={proveedor} onChange={e => setProveedor(e.target.value)} className="h-11">
                        <option value="">Sin asignar</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                </div>

                {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

                <div className="grid grid-cols-2 gap-3 pt-1">
                    <Button variant="outline" onClick={onClose} className="h-11 text-slate-500">Cancelar</Button>
                    <Button
                        variant="ghost"
                        onClick={guardar}
                        disabled={!nombre.trim() || guardando}
                        className="h-11 !bg-amber-500 !text-white hover:!bg-amber-600 font-bold disabled:opacity-50"
                    >
                        {guardando ? 'Creando…' : 'Crear y usar'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
