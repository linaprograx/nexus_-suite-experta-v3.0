import React from 'react';
import { Recipe } from '../../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { calculatePricing } from '../../core/costing/pricingEngine';
import { formatCost } from '../../core/costing/costFormatter';

export const RecipeCard: React.FC<{ recipe: Recipe; onEdit: () => void; onDragStart: (e: React.DragEvent, recipe: Recipe) => void; }> = ({ recipe, onEdit, onDragStart }) => {
    const pricing = calculatePricing(recipe.costoReceta || 0);

    return (
        <Card
            className="overflow-hidden cursor-grab"
            draggable="true"
            onDragStart={(e) => onDragStart(e, recipe)}
            onClick={onEdit}
        >
            <img src={recipe.imageUrl || 'https://placehold.co/600x400/27272a/FFF?text=Receta'} alt={recipe.nombre} className="h-32 w-full object-cover" />
            <CardHeader>
                <CardTitle>{recipe.nombre}</CardTitle>
                <div className="flex flex-wrap gap-1 mt-1">
                    {recipe.categorias?.map(cat => (
                        <span key={cat} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{cat}</span>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between text-sm">
                    <span>Costo:</span>
                    <span className="font-bold">{formatCost(recipe.costoReceta)}</span>
                </div>
                <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                    <span>PVP Rec.:</span>
                    <span className="font-bold">{formatCost(pricing.precioRecomendado)}</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full" onClick={onEdit}>Ver / Editar</Button>
            </CardFooter>
        </Card>
    );
};
