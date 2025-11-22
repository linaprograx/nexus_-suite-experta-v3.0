import { ICONS } from '../ui/icons';

// Helper para colores de categoría (Sutil)
export const getCategoryColor = (category: string | undefined) => {
  if (!category) return 'border-gray-500';
  const hash = category.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const colors = [
    "border-blue-500", "border-green-500", "border-yellow-500",
    "border-red-500", "border-purple-500", "border-pink-500",
    "border-indigo-500", "border-teal-500",
  ];
  return colors[Math.abs(hash) % colors.length];
};

// Helper para iconos de prioridad
export const getPriorityIcon = (priority: 'baja' | 'media' | 'alta') => {
  if (priority === 'alta') return { icon: ICONS.chevronsUp, color: "text-red-500" };
  if (priority === 'media') return { icon: ICONS.arrowUp, color: "text-yellow-500" };
  return { icon: ICONS.minus, color: "text-gray-500" };
};

// (Helpers para la lógica del calendario)
export const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};
export const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0=Domingo, 1=Lunes
};
export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};
export const DAYS_OF_WEEK = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
