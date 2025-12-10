import { Ticket } from './types';

export class TicketEngine {

    static createTicket(recipe: any, areaId: string): Ticket {
        return {
            id: crypto.randomUUID(),
            recipeId: recipe.id,
            recipeName: recipe.nombre || 'Unknown Drink',
            areaId,
            priority: 'normal',
            status: 'pending',
            createdAt: Date.now(),
            ingredients: recipe.ingredientes?.map((i: any) => ({
                id: i.id,
                name: i.nombre,
                quantity: i.cantidad || 1
            }))
        };
    }

    static processTickets(tickets: Ticket[]): Ticket[] {
        // Remove completed/cancelled tickets older than 5 minutes to keep state clean
        const now = Date.now();
        const cleanupThreshold = 5 * 60 * 1000;

        return tickets.filter(t => {
            if (t.status === 'completed' || t.status === 'cancelled') {
                return (now - t.createdAt) < cleanupThreshold;
            }
            return true;
        });
    }

    static updateTicketStatus(tickets: Ticket[], ticketId: string, status: Ticket['status']): Ticket[] {
        return tickets.map(t => t.id === ticketId ? { ...t, status } : t);
    }
}
