import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { useSuppliers } from '../../../features/suppliers/hooks/useSuppliers';
import { useApp } from '../../../context/AppContext';
import { useIngredients } from '../../../hooks/useIngredients';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const GrimorioMarket: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId } = useApp();
    const { suppliers, loading: loadingSuppliers } = useSuppliers({ db, userId });
    const { ingredients, isLoading: loadingIngredients } = useIngredients();
    const [activeCategory, setActiveCategory] = useState<'featured' | 'suppliers' | 'equipment'>('featured');

    const CATEGORY_LABELS = {
        featured: 'Destacados',
        suppliers: 'Proveedores',
        equipment: 'Equipamiento'
    };

    // Mock featured equipment items
    const featuredEquipment = [
        {
            id: 1,
            name: 'Set Premium de Coctelería',
            category: 'equipment',
            price: 89.99,
            rating: 4.8,
            reviews: 234,
            inStock: true,
            specs: ['Acero Inoxidable', 'Capacidad 24oz', 'A Prueba de Fugas'],
        },
        {
            id: 2,
            name: 'Colador Profesional',
            category: 'equipment',
            price: 34.99,
            rating: 4.7,
            reviews: 189,
            inStock: false,
            specs: ['Estilo Hawthorne', 'Resorte Espiral', 'Profesional'],
        },
    ];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header */}
            <header className="pt-4 pb-4 px-5 z-10 relative">
                <div className="flex justify-between items-start mb-6 px-2">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.2em] text-white/80 uppercase mb-1">Nexus Suite</p>
                        <h1 className="text-5xl font-extrabold text-white tracking-tighter leading-[0.9]">
                            NEXUS<br />
                            <span className="text-white/80">MARKET</span>
                        </h1>
                    </div>
                    <div className="bg-white/20 backdrop-blur-2xl border border-white/30 rounded-full p-3 shadow-xl">
                        <span className="material-symbols-outlined text-white fill-1">shopping_cart</span>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {(['featured', 'suppliers', 'equipment'] as const).map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all
                                ${activeCategory === category
                                    ? 'bg-white text-emerald-600 shadow-md'
                                    : 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30'
                                }`}
                        >
                            {CATEGORY_LABELS[category]}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 pb-32 space-y-4">

                {/* PROVEEDORES SECTION */}
                {activeCategory === 'suppliers' && (
                    <>
                        {loadingSuppliers ? (
                            <div className="flex justify-center py-10">
                                <span className="material-symbols-outlined animate-spin text-emerald-500">sync</span>
                            </div>
                        ) : suppliers.length > 0 ? suppliers.map((supplier) => {
                            // Count products from this supplier
                            const supplierProducts = ingredients.filter(ing =>
                                ing.proveedores?.includes(supplier.id) || ing.proveedor === supplier.id
                            );

                            return (
                                <GlassCard
                                    key={supplier.id}
                                    rounded="3xl"
                                    padding="md"
                                    className="relative group transition-all cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="flex gap-4 mb-4">
                                        {/* Supplier Icon */}
                                        <div className="w-20 h-20 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-3xl text-emerald-600 fill-1">store</span>
                                        </div>

                                        {/* Supplier Info */}
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-zinc-900 mb-1">{supplier.name}</h2>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase">
                                                    {supplier.category}
                                                </span>
                                                <span className="text-[10px] text-zinc-500">
                                                    {supplierProducts.length} productos
                                                </span>
                                            </div>
                                            {supplier.contactName && (
                                                <p className="text-xs text-zinc-600 mb-1">
                                                    <span className="material-symbols-outlined !text-xs align-middle mr-1">person</span>
                                                    {supplier.contactName}
                                                </p>
                                            )}
                                            {supplier.phone && (
                                                <p className="text-xs text-zinc-600">
                                                    <span className="material-symbols-outlined !text-xs align-middle mr-1">call</span>
                                                    {supplier.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-zinc-50 px-3 py-2 rounded-xl">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Entrega</p>
                                            <p className="text-xs font-black text-zinc-900">{supplier.leadTimeDays || 0} días</p>
                                        </div>
                                        <div className="bg-zinc-50 px-3 py-2 rounded-xl">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Pago</p>
                                            <p className="text-xs font-black text-zinc-900">{supplier.paymentTerms || 'Contado'}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button className="flex-[0.4] py-3.5 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                                            Catálogo
                                        </button>
                                        <PremiumButton
                                            module="grimorioMarket"
                                            variant="gradient"
                                            size="md"
                                            icon={<span className="material-symbols-outlined !text-sm">shopping_bag</span>}
                                            iconPosition="right"
                                            className="flex-1"
                                        >
                                            HACER PEDIDO
                                        </PremiumButton>
                                    </div>
                                </GlassCard>
                            );
                        }) : (
                            <GlassCard rounded="3xl" padding="xl" className="text-center">
                                <span className="material-symbols-outlined text-6xl text-zinc-300 mb-3 block">store</span>
                                <h3 className="text-lg font-bold text-zinc-900 mb-2">No hay proveedores</h3>
                                <p className="text-sm text-zinc-500 mb-5">Agrega proveedores desde la versión Desktop</p>
                            </GlassCard>
                        )}
                    </>
                )}

                {/* FEATURED ITEMS */}
                {activeCategory === 'featured' && featuredEquipment.map((item, i) => (
                    <GlassCard
                        key={item.id}
                        rounded="3xl"
                        padding="md"
                        className="relative group transition-all"
                    >
                        {i === 0 && (
                            <div className="absolute top-4 right-4 z-10 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider shadow-lg">
                                Destacado
                            </div>
                        )}

                        <div className="flex gap-4 mb-4">
                            <div className="w-24 h-24 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-4xl text-emerald-600 fill-1">liquor</span>
                            </div>

                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-zinc-900 mb-1.5">{item.name}</h2>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs text-yellow-500 fill-1">star</span>
                                        <span className="text-xs font-bold text-zinc-700">{item.rating}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400">({item.reviews} reseñas)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-emerald-600">${item.price}</span>
                                    {item.inStock ? (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase">En Stock</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[8px] font-black uppercase">Pre-Orden</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                            {item.specs.map((spec, index) => (
                                <span key={index} className="text-[9px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-lg uppercase tracking-wide">
                                    {spec}
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-[0.4] py-3.5 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                                Detalles
                            </button>
                            <PremiumButton
                                module="grimorioMarket"
                                variant="gradient"
                                size="md"
                                icon={<span className="material-symbols-outlined !text-sm">{item.inStock ? 'shopping_bag' : 'schedule'}</span>}
                                iconPosition="right"
                                className="flex-1"
                            >
                                {item.inStock ? 'COMPRAR' : 'PRE-ORDENAR'}
                            </PremiumButton>
                        </div>
                    </GlassCard>
                ))}

                {/* EQUIPMENT SECTION */}
                {activeCategory === 'equipment' && featuredEquipment.map((item) => (
                    <GlassCard
                        key={item.id}
                        rounded="3xl"
                        padding="md"
                        className="relative group transition-all"
                    >
                        <div className="flex gap-4 mb-4">
                            <div className="w-24 h-24 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-4xl text-emerald-600 fill-1">liquor</span>
                            </div>

                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-zinc-900 mb-1.5">{item.name}</h2>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs text-yellow-500 fill-1">star</span>
                                        <span className="text-xs font-bold text-zinc-700">{item.rating}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400">({item.reviews} reseñas)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-emerald-600">${item.price}</span>
                                    {item.inStock ? (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase">En Stock</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[8px] font-black uppercase">Pre-Orden</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                            {item.specs.map((spec, index) => (
                                <span key={index} className="text-[9px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-lg uppercase tracking-wide">
                                    {spec}
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-[0.4] py-3.5 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                                Detalles
                            </button>
                            <PremiumButton
                                module="grimorioMarket"
                                variant="gradient"
                                size="md"
                                icon={<span className="material-symbols-outlined !text-sm">{item.inStock ? 'shopping_bag' : 'schedule'}</span>}
                                iconPosition="right"
                                className="flex-1"
                            >
                                {item.inStock ? 'COMPRAR' : 'PRE-ORDENAR'}
                            </PremiumButton>
                        </div>
                    </GlassCard>
                ))}

                {/* Deployment Card - Only on featured */}
                {activeCategory === 'featured' && (
                    <GlassCard rounded="3xl" padding="lg" className="bg-gradient-to-r from-emerald-50 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-xl action-glow-emerald">
                                <span className="material-symbols-outlined text-3xl fill-1">rocket_launch</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-zinc-900 mb-1">Despliegue Rápido</h3>
                                <p className="text-xs text-zinc-500 font-medium">Lanza tu configuración completa al instante</p>
                            </div>
                            <PremiumButton
                                module="grimorioMarket"
                                variant="gradient"
                                size="sm"
                            >
                                DESPLEGAR
                            </PremiumButton>
                        </div>
                    </GlassCard>
                )}
            </main>
        </div>
    );
};

export default GrimorioMarket;
