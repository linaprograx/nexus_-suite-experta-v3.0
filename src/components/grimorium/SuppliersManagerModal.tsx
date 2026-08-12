import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useSuppliers } from '../../features/suppliers/hooks/useSuppliers';
import { useSupplierProducts } from '../../features/suppliers/hooks/useSupplierProducts';
import { useIngredients } from '../../hooks/useIngredients'; // For checking global ingredients
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Supplier } from '../../types';
import { parseEuroNumber } from '../../utils/parseEuroNumber';
import { SelectorCategorias } from '../../features/suppliers/SelectorCategorias';
import { collection, doc } from 'firebase/firestore';
import { EscrituraPorLotes, FalloEnLotes } from '../../services/firestore/escrituraPorLotes';

const DELIVERY_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface SuppliersManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SuppliersManagerModal: React.FC<SuppliersManagerModalProps> = ({ isOpen, onClose }) => {
    const { db, userId, appId } = useApp();
    const { suppliers, addSupplier, deleteSupplier, loading } = useSuppliers({ db, userId });
    // We instantiate hooks but only use them when needed. 
    // Note: useSupplierProducts requires a supplierId, so we can't use it easily for *all* suppliers at once here 
    // without selecting one. But for catalog upload we will likely be in a "Edit Supplier" mode or "Select Supplier" mode.
    // The current modal design shows a list. 
    // Let's allow uploading a catalog FOR a specific supplier.

    // Global Ingredients to check for duplicates
    const { ingredients: globalIngredients } = useIngredients();

    const [view, setView] = useState<'list' | 'form' | 'details'>('list');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
        name: '', contactName: '', email: '', phone: '', category: 'Otros', deliveryDays: []
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!newSupplier.name) return;
        try {
            await addSupplier(newSupplier as any);
            setView('list');
            setNewSupplier({ name: '', contactName: '', email: '', phone: '', category: 'Otros', deliveryDays: [] });
        } catch (e) {
            console.error(e);
            alert("Error al guardar proveedor");
        }
    };

    const handleCatalogUpload = async (e: React.ChangeEvent<HTMLInputElement>, supplier: Supplier) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!db || !userId || !appId) { alert('Sesión no inicializada.'); return; }

        setUploading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split('\n').slice(1); // Skip header
            // Dos escrituras por linea del CSV —el producto del proveedor y su
            // ingrediente global—, asi que un catalogo de 250 filas ya se pasaba
            // del limite de 500 de un `writeBatch` y Firestore lo rechazaba
            // entero, sin escribir nada.
            const lotes = new EscrituraPorLotes(db);
            const supplierProductsRef = collection(db, `users/${userId}/suppliers/${supplier.id}/supplierProducts`);
            const globalIngredientsRef = collection(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`);

            let addedCount = 0;
            let globalCreatedCount = 0;
            let globalUpdatedCount = 0;

            // Map existing global ingredients for fast lookup
            const existingMap = new Map(globalIngredients.map(gi => [gi.nombre.toLowerCase().trim(), gi]));

            for (const line of lines) {
                if (!line.trim()) continue;
                const cols = line.split(line.includes(';') ? ';' : ',');
                const rawName = cols[0]?.trim();
                const rawPrice = parseEuroNumber(cols[1]);
                const rawUnit = cols[2]?.trim() || 'und';

                if (!rawName) continue;

                // 1. Add to Supplier Products (Always separate)
                const productDoc = doc(supplierProductsRef);
                await lotes.set(productDoc, {
                    productId: productDoc.id,
                    productName: rawName,
                    price: rawPrice,
                    unit: rawUnit,
                    supplierId: supplier.id,
                    updatedAt: new Date()
                });
                addedCount++;

                // 2. Check & Sync with Global Ingredients
                const normalizedRawName = rawName.toLowerCase();
                const existingIng = existingMap.get(normalizedRawName);

                if (existingIng) {
                    // Ingredient exists: Update Link & SupplierData
                    const ingRef = doc(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`, existingIng.id);
                    const updates: any = {};
                    let needsUpdate = false;

                    // Link Supplier ID if missing
                    if (!existingIng.proveedores?.includes(supplier.id)) {
                        updates.proveedores = [...(existingIng.proveedores || []), supplier.id];
                        needsUpdate = true;
                    }

                    // Update SupplierData (Price)
                    const currentSupplierData = existingIng.supplierData || {};
                    const newSupplierDataEntry = {
                        price: rawPrice,
                        unit: rawUnit,
                        lastUpdated: new Date() // Firestore will convert or we use serverTimestamp() if imported
                    };

                    // Only update if price changed or entry missing
                    if (JSON.stringify(currentSupplierData[supplier.id]) !== JSON.stringify(newSupplierDataEntry)) {
                        updates.supplierData = {
                            ...currentSupplierData,
                            [supplier.id]: newSupplierDataEntry
                        };
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        await lotes.update(ingRef, updates);
                        globalUpdatedCount++;
                    }

                } else {
                    // Create New Global Ingredient
                    const ingDoc = doc(globalIngredientsRef);
                    await lotes.set(ingDoc, {
                        nombre: rawName,
                        categoria: 'General', // Default
                        precioCompra: rawPrice,
                        unidadCompra: rawUnit,
                        wastePercentage: 0,
                        proveedores: [supplier.id],
                        standardUnit: 'und',
                        standardQuantity: 1,
                        supplierData: {
                            [supplier.id]: {
                                price: rawPrice,
                                unit: rawUnit,
                                lastUpdated: new Date()
                            }
                        }
                    });
                    globalCreatedCount++;
                }
            }

            try {
                await lotes.cerrar();
                alert(`Catálogo importado:\n- ${addedCount} productos al catálogo de ${supplier.name}\n- ${globalCreatedCount} nuevos ingredientes creados\n- ${globalUpdatedCount} ingredientes existentes vinculados`);
            } catch (err) {
                console.error(err);
                alert(err instanceof FalloEnLotes ? err.message : "Error subiendo catálogo.");
            } finally {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    /**
     * Va a `document.body`, no donde está escrito.
     *
     * El armazón móvil pinta el contenido dentro de un `<div relative z-20>`, y
     * eso **crea un contexto de apilamiento**: todo lo de dentro queda encerrado
     * en el nivel 20 frente a sus hermanos, por muy alto que sea su propio
     * z-index. Así que este modal, con `z-50`, seguía saliendo por detrás de la
     * franja de Grimorio, que está en `z-30`. No era cuestión de subir el
     * número: desde dentro de esa caja no hay número que valga.
     *
     * El portal lo saca de la caja. Es lo que ya hacía la primitiva `Modal`, de
     * la que este componente se había separado —importaba `Modal` sin usarla y
     * montaba su propio contenedor—, y de ahí venía la diferencia.
     */
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Modal Content - Premium Glassmorphism */}
            <div className="relative w-full max-w-4xl h-[70vh] flex flex-col bg-white dark:bg-slate-900 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative p-6 border-b border-slate-200 dark:border-white/10 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600" /><div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative flex justify-between items-center z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Gestión de Proveedores</h2>
                            <p className="text-white/80 text-sm">Administra tus socios y sus catálogos</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white">
                            <Icon svg={ICONS.x} />
                        </Button>
                    </div>
                </div>

                {/* Dos columnas en escritorio, UNA cada vez en móvil.
                    Un tercio de 365 px son 120: las tarjetas salían cortadas por
                    la mitad («BORDINOS» sin su categoría, «Catálogo» a medias) y
                    el panel de detalle, vacío, se comía dos tercios de la
                    pantalla para no decir nada. En móvil se ve la lista, y al
                    tocar un proveedor su ficha la sustituye. */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Sidebar / List */}
                    <div className={`w-full md:w-1/3 border-r border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex-col ${view === 'list' ? 'flex' : 'hidden md:flex'}`}>
                        <div className="p-4 border-b border-slate-200 dark:border-white/5">
                            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" onClick={() => { setView('form'); setSelectedSupplier(null); }}>
                                <Icon svg={ICONS.plus} className="mr-2 h-4 w-4" /> Nuevo Proveedor
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {suppliers.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => { setSelectedSupplier(s); setView('details'); }}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${selectedSupplier?.id === s.id ? 'bg-emerald-500/15 border-emerald-500/50' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-transparent hover:border-emerald-300 dark:hover:bg-white/10'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200">{s.name}</h3>
                                        {s.category && <span className="text-[10px] uppercase bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">{s.category}</span>}
                                    </div>
                                    <div className="mt-1 flex items-center text-xs text-slate-500 gap-2">
                                        <span>{s.contactName || 'Sin contacto'}</span>
                                        {s.productList && <span className="bg-emerald-500/10 text-emerald-400 px-1 rounded flex items-center gap-1"><Icon svg={ICONS.grid} className="w-3 h-3" /> Catálogo</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className={`flex-1 bg-white dark:bg-slate-950/30 flex-col overflow-hidden ${view === 'list' ? 'hidden md:flex' : 'flex'}`}>
                        {view === 'form' ? (
                            /* Con scroll propio. El panel padre es `overflow-hidden`
                               y el modal mide 70vh: en un móvil el formulario se
                               cortaba por «Días de entrega» y los botones de
                               Cancelar y Guardar quedaban fuera de la pantalla, sin
                               forma de alcanzarlos. Es decir, no se podía dar de
                               alta un proveedor desde el teléfono. */
                            <div className="p-5 md:p-8 max-w-xl mx-auto w-full h-full overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Nuevo Proveedor</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label className="text-slate-500 dark:text-slate-400">Empresa / Nombre</Label><Input className="bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} /></div>
                                        <div className="space-y-1">
                                            <Label className="text-slate-500 dark:text-slate-400">Categoría</Label>
                                            {/* Barra desplegable, no 19 fichas a la vista: ocupaban
                                                una fila entera y empujaban el resto del formulario
                                                fuera de la pantalla. Marca VARIAS —el catálogo real ya
                                                usa «ALCOHOL, MIXERS»— y se guardan separadas por coma,
                                                el mismo formato de siempre, sin migrar nada. */}
                                            <SelectorCategorias
                                                valor={newSupplier.category}
                                                onCambio={category => setNewSupplier({ ...newSupplier, category })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label className="text-slate-500 dark:text-slate-400">Contacto</Label><Input className="bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white" value={newSupplier.contactName} onChange={e => setNewSupplier({ ...newSupplier, contactName: e.target.value })} /></div>
                                        <div className="space-y-1"><Label className="text-slate-500 dark:text-slate-400">Teléfono</Label><Input className="bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} /></div>
                                    </div>
                                    <div className="space-y-1"><Label className="text-slate-500 dark:text-slate-400">Email</Label><Input className="bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} /></div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label className="text-slate-500 dark:text-slate-400">Dirección</Label><Input className="bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white" value={newSupplier.address || ''} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} placeholder="Calle, ciudad…" /></div>
                                        <div className="space-y-1"><Label className="text-slate-500 dark:text-slate-400">CIF / NIF</Label><Input className="bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white" value={newSupplier.taxId || ''} onChange={e => setNewSupplier({ ...newSupplier, taxId: e.target.value })} placeholder="B12345678" /></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label className="text-slate-500 dark:text-slate-400">Plazo de entrega (días)</Label><Input type="number" min="0" className="bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white" value={newSupplier.leadTimeDays ?? ''} onChange={e => setNewSupplier({ ...newSupplier, leadTimeDays: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Ej. 2" /></div>
                                        <div className="space-y-1"><Label className="text-slate-500 dark:text-slate-400">Condiciones de pago</Label><Input className="bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white" value={newSupplier.paymentTerms || ''} onChange={e => setNewSupplier({ ...newSupplier, paymentTerms: e.target.value })} placeholder="Ej. 30 días fin de mes" /></div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-slate-500 dark:text-slate-400">Días de entrega</Label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {DELIVERY_DAYS.map(day => {
                                                const active = (newSupplier.deliveryDays || []).includes(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => setNewSupplier(s => {
                                                            const cur = s.deliveryDays || [];
                                                            return { ...s, deliveryDays: active ? cur.filter(d => d !== day) : [...cur, day] };
                                                        })}
                                                        className={`px-2.5 h-7 rounded-full text-[11px] font-bold transition-colors ${active ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-6 flex gap-3 justify-end">
                                        <Button variant="ghost" onClick={() => setView('list')} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">Cancelar</Button>
                                        <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[120px]">Guardar</Button>
                                    </div>
                                </div>
                            </div>
                        ) : selectedSupplier ? (
                            <div className="p-5 md:p-8 flex flex-col h-full animate-in fade-in overflow-y-auto custom-scrollbar">
                                {/* La vuelta a la lista. En escritorio la lista sigue
                                    ahí al lado y no hace falta; en móvil la sustituye
                                    esta ficha, así que sin esto sería un callejón sin
                                    salida del que solo se sale cerrando el modal. */}
                                <button
                                    onClick={() => { setSelectedSupplier(null); setView('list'); }}
                                    className="md:hidden self-start mb-4 flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                >
                                    <Icon svg={ICONS.chevronDown} className="w-4 h-4 rotate-90" />
                                    Todos los proveedores
                                </button>
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{selectedSupplier.name}</h2>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                                            {selectedSupplier.contactName && <span className="flex items-center gap-1"><Icon svg={ICONS.user} className="w-4 h-4" /> {selectedSupplier.contactName}</span>}
                                            {selectedSupplier.email && <span className="flex items-center gap-1"><Icon svg={ICONS.messageCircle} className="w-4 h-4" /> {selectedSupplier.email}</span>}
                                            {selectedSupplier.phone && <span>📞 {selectedSupplier.phone}</span>}
                                        </div>
                                        {/* Extended supplier info (procurement data) */}
                                        {/* `Boolean(...)` no es adorno. La condición acaba en
                                            `deliveryDays?.length`, que con un array vacío vale 0:
                                            en React `0 && <algo>` **pinta el cero**, y salía un «0»
                                            suelto bajo el teléfono de todo proveedor sin datos
                                            de compra. */}
                                        {Boolean(selectedSupplier.address || selectedSupplier.taxId || selectedSupplier.leadTimeDays != null || selectedSupplier.paymentTerms || selectedSupplier.deliveryDays?.length) && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {selectedSupplier.address && <span className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">📍 {selectedSupplier.address}</span>}
                                                {selectedSupplier.taxId && <span className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">CIF {selectedSupplier.taxId}</span>}
                                                {selectedSupplier.leadTimeDays != null && <span className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">⏱ {selectedSupplier.leadTimeDays}d entrega</span>}
                                                {selectedSupplier.paymentTerms && <span className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">💳 {selectedSupplier.paymentTerms}</span>}
                                                {selectedSupplier.deliveryDays?.length ? <span className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">📅 {selectedSupplier.deliveryDays.join(', ')}</span> : null}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="destructive" size="sm" onClick={() => { if (confirm('Eliminar proveedor?')) { deleteSupplier(selectedSupplier.id); setSelectedSupplier(null); } }}>
                                            <Icon svg={ICONS.trash} className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Catalog Section */}
                                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-emerald-400">Catálogo de Productos</h3>
                                            <p className="text-xs text-slate-500">Sincroniza precios e ingredientes automáticamente</p>
                                        </div>
                                        <div>
                                            <input
                                                type="file"
                                                accept=".csv"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={(e) => handleCatalogUpload(e, selectedSupplier)}
                                            />
                                            <Button
                                                variant="outline"
                                                className="border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                            >
                                                {uploading ? 'Subiendo...' : (
                                                    <><Icon svg={ICONS.upload} className="w-4 h-4 mr-2" /> Subir CSV</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Placeholder for list or stats */}
                                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-black/20 text-slate-400">
                                        <div className="text-center">
                                            <Icon svg={ICONS.grid} className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>Sube un archivo CSV para ver los productos</p>
                                            <p className="text-xs mt-1 opacity-50">Formato: Nombre, Precio, Unidad</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500">
                                <p>Selecciona un proveedor para ver detalles</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};
