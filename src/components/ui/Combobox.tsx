import React from 'react';
import { Input } from './Input';
import { Ingredient, Recipe } from '../../../types';

export const Combobox: React.FC<{
    items: (Ingredient | Recipe)[];
    onSelect: (item: Ingredient | Recipe) => void;
    placeholder: string;
}> = ({ items, onSelect, placeholder }) => {
    const [search, setSearch] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredItems = React.useMemo(() => {
        if (!search) return [];
        return items.filter(item => item.nombre.toLowerCase().includes(search.toLowerCase()));
    }, [search, items]);
    
    return (
        <div className="relative" ref={wrapperRef}>
            <Input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setIsOpen(true)}
            />
            {isOpen && search && (
                <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="px-4 py-2 hover:bg-accent cursor-pointer"
                                onClick={() => {
                                    onSelect(item);
                                    setSearch('');
                                    setIsOpen(false);
                                }}
                            >
                                {item.nombre}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-muted-foreground">No se encontraron resultados.</div>
                    )}
                </div>
            )}
        </div>
    );
}
