import React from 'react';
import { Auth } from 'firebase/auth';
import { Recipe, PizarronTask, Ingredient, ViewName } from '../../types';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { 
  FaBook, 
  FaBolt, 
  FaMagic, 
  FaClock, 
  FaChartLine,
  FaLightbulb, 
  FaFlask, 
  FaExclamationCircle, 
  FaCalendarAlt,
  FaArrowRight
} from 'react-icons/fa';
import { 
  ResponsiveContainer, 
  AreaChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Area, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';

// Helper components for the new layout
const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = "bg-primary" }) => (
  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
    <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }}></div>
  </div>
);

const AvatarPlaceholder: React.FC<{ name?: string; url?: string }> = ({ name, url }) => {
  if (url) {
    return <img src={url} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm border-2 border-white">
      {name ? name.charAt(0).toUpperCase() : 'U'}
    </div>
  );
};

const DashboardView: React.FC<{
  allRecipes: Recipe[];
  allPizarronTasks: PizarronTask[];
  allIngredients: Ingredient[];
  auth: Auth;
  setCurrentView: (view: ViewName) => void;
}> = ({ allRecipes, allPizarronTasks, allIngredients, auth, setCurrentView }) => {
    const { userProfile } = useApp();

    // --- 1. Metrics & Data Processing ---

    const kpis = React.useMemo(() => {
        const totalRecipes = allRecipes.length;
        const totalTasks = allPizarronTasks.length;
        // Simple calculation for "Tiempo Ahorrado" based on logic from previous file
        const tiempoAhorrado = (totalRecipes * 0.5) + (totalTasks * 0.25);
        const creativeRate = 85; // Placeholder percentage
        return { totalRecipes, totalTasks, tiempoAhorrado, creativeRate };
    }, [allRecipes, allPizarronTasks]);

    const creativeTrendData = React.useMemo(() => {
        const activityByDate: { [key: string]: { recipes: number, tasks: number } } = {};
        
        allPizarronTasks.forEach(item => {
            if (item.createdAt?.toDate) {
                const date = item.createdAt.toDate().toISOString().split('T')[0];
                if (!activityByDate[date]) {
                    activityByDate[date] = { recipes: 0, tasks: 0 };
                }
                activityByDate[date].tasks++;
            }
        });

        // Also consider recipes if they had dates (assuming basic structure doesn't ensure it, but just in case)
        // For now, using tasks as the main driver for the chart as per original code

        // Fill recent dates if empty to ensure chart looks okay
        const today = new Date();
        for(let i=6; i>=0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            if (!activityByDate[dateStr]) {
                activityByDate[dateStr] = { recipes: 0, tasks: 0 };
            }
        }

        return Object.entries(activityByDate)
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-7); // Last 7 days
    }, [allPizarronTasks]);

    const balanceData = [
        { subject: 'Dulce', A: 8, fullMark: 10 },
        { subject: 'Cítrico', A: 9, fullMark: 10 },
        { subject: 'Amargo', A: 6, fullMark: 10 },
        { subject: 'Alcohol', A: 7, fullMark: 10 },
        { subject: 'Herbal', A: 5, fullMark: 10 },
        { subject: 'Especiado', A: 4, fullMark: 10 },
    ];

    // --- Column Data Filters ---
    const ideasTasks = React.useMemo(() => 
        allPizarronTasks.filter(t => t.status === 'ideas').slice(0, 10), 
    [allPizarronTasks]);

    const inProgressTasks = React.useMemo(() => 
        allPizarronTasks.filter(t => t.status === 'pruebas').slice(0, 10), 
    [allPizarronTasks]);

    const priorityTasks = React.useMemo(() => 
        allPizarronTasks.filter(t => t.category === 'Urgente').slice(0, 10), 
    [allPizarronTasks]);

    // --- Components ---

    const KpiCard = ({ title, value, icon, trend, colorClass }: any) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 text-current`}>
                    {icon}
                </div>
                {trend && (
                    <span className="text-xs font-medium text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
    );

    const TaskListItem = ({ task, color }: { task: PizarronTask, color: string }) => (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors group">
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">{task.texto}</h4>
                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${color} bg-opacity-10 text-current`}>
                    {task.category}
                </span>
            </div>
            <div className="flex items-center justify-between mt-2">
                 <ProgressBar value={Math.random() * 100} color={color.replace('text-', 'bg-')} />
                 <div className="ml-3">
                    <AvatarPlaceholder name={task.authorName} url={task.authorPhotoURL} />
                 </div>
            </div>
        </div>
    );

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 lg:p-10 space-y-8 pb-32">
            
            {/* 1. Hero Section */}
            <section className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="relative">
                        {userProfile?.photoURL ? (
                            <img src={userProfile.photoURL} alt="Profile" className="w-16 h-16 rounded-full object-cover border-4 border-indigo-50 dark:border-indigo-900" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-indigo-50 dark:border-indigo-900">
                                {userProfile?.displayName?.[0] || auth.currentUser?.email?.[0] || 'U'}
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Bienvenido, {userProfile?.displayName || auth.currentUser?.email?.split('@')[0]}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Tu centro de control diario</p>
                    </div>
                </div>
                <div className="w-full md:w-1/3">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">Nivel de Experto</span>
                        <span className="text-indigo-600 font-bold">Nivel 7</span>
                    </div>
                    <ProgressBar value={70} color="bg-indigo-600" />
                    <p className="text-xs text-gray-400 mt-1 text-right">300 XP para el siguiente nivel</p>
                </div>
            </section>

            {/* 2. KPI Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div onClick={() => setCurrentView('grimorium')} className="cursor-pointer">
                    <KpiCard 
                        title="Total Recetas" 
                        value={kpis.totalRecipes} 
                        icon={<FaBook size={20} />} 
                        colorClass="text-blue-600 bg-blue-600"
                        trend="+12% vs mes pasado"
                    />
                </div>
                <div onClick={() => setCurrentView('pizarron')} className="cursor-pointer">
                    <KpiCard 
                        title="Total Tareas" 
                        value={kpis.totalTasks} 
                        icon={<FaBolt size={20} />} 
                        colorClass="text-amber-500 bg-amber-500"
                    />
                </div>
                <KpiCard 
                    title="Tasa Creativa" 
                    value={`${kpis.creativeRate}%`} 
                    icon={<FaMagic size={20} />} 
                    colorClass="text-purple-600 bg-purple-600"
                    trend="Constante"
                />
                <KpiCard 
                    title="Tiempo Ahorrado" 
                    value={`${kpis.tiempoAhorrado.toFixed(1)}h`} 
                    icon={<FaClock size={20} />} 
                    colorClass="text-green-600 bg-green-600"
                    trend="Métrica de Impacto"
                />
            </section>

            {/* 3. Charts Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-md border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FaChartLine className="text-indigo-500" /> Actividad Creativa
                        </CardTitle>
                        <CardDescription>Flujo de trabajo en los últimos 7 días</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={creativeTrendData}>
                                <defs>
                                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.1)" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#9CA3AF', fontSize: 12}}
                                    tickFormatter={(value) => new Date(value).getDate().toString()}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#9CA3AF', fontSize: 12}} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="tasks" 
                                    stroke="#6366f1" 
                                    strokeWidth={2} 
                                    fillOpacity={1} 
                                    fill="url(#colorTasks)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-md border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FaFlask className="text-pink-500" /> Equilibrio de Carta
                        </CardTitle>
                        <CardDescription>Perfil de sabor promedio</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={balanceData}>
                                    <PolarGrid stroke="rgba(156, 163, 175, 0.2)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                    <Radar name="Sabor" dataKey="A" stroke="#ec4899" fill="#ec4899" fillOpacity={0.5} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* 4. "Lo que debes hacer hoy" & 5. Actividad Reciente */}
            <section className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                
                {/* To-Do Board (Takes 3 cols on large screens) */}
                <div className="xl:col-span-3">
                    <Card className="h-full shadow-md border border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Lo que debes hacer hoy</CardTitle>
                                    <CardDescription>Tu roadmap diario priorizado</CardDescription>
                                </div>
                                <button 
                                    onClick={() => setCurrentView('pizarron')}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                >
                                    Ver todo <FaArrowRight size={12} />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Col 1: Ideas */}
                                <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-dashed border-gray-200 dark:border-gray-700">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <FaLightbulb className="text-yellow-500" /> Ideas del Pizarrón
                                    </h3>
                                    <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                        {ideasTasks.length > 0 ? (
                                            ideasTasks.map(task => (
                                                <TaskListItem key={task.id} task={task} color="text-yellow-600" />
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 text-xs">
                                                No hay ideas pendientes
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Col 2: En Progreso */}
                                <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-dashed border-gray-200 dark:border-gray-700">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <FaFlask className="text-blue-500" /> Recetas en Progreso
                                    </h3>
                                    <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                        {inProgressTasks.length > 0 ? (
                                            inProgressTasks.map(task => (
                                                <TaskListItem key={task.id} task={task} color="text-blue-600" />
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 text-xs">
                                                Sin pruebas activas
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Col 3: Prioridad */}
                                <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-dashed border-gray-200 dark:border-gray-700">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <FaExclamationCircle className="text-red-500" /> Prioritario / Urgente
                                    </h3>
                                    <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                        {priorityTasks.length > 0 ? (
                                            priorityTasks.map(task => (
                                                <TaskListItem key={task.id} task={task} color="text-red-600" />
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 text-xs">
                                                Todo bajo control
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 5. Activity Timeline */}
                <div className="xl:col-span-1">
                    <Card className="h-full shadow-md border border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle>Actividad Reciente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-700 space-y-8">
                                {/* Placeholder Timeline Items */}
                                {[
                                    { text: "Nueva receta creada", time: "Hace 2h", icon: <FaBook size={12} />, color: "bg-blue-500" },
                                    { text: "Escandallo actualizado", time: "Hace 5h", icon: <FaChartLine size={12} />, color: "bg-green-500" },
                                    { text: "Menú de temporada aprobado", time: "Ayer", icon: <FaCalendarAlt size={12} />, color: "bg-purple-500" },
                                    { text: "Inventario revisado", time: "Ayer", icon: <FaBolt size={12} />, color: "bg-amber-500" }
                                ].map((item, idx) => (
                                    <div key={idx} className="relative">
                                        <div className={`absolute -left-[21px] top-0 w-8 h-8 rounded-full border-4 border-white dark:border-gray-900 ${item.color} flex items-center justify-center text-white`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.text}</p>
                                            <span className="text-xs text-gray-400">{item.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-8 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                                Ver historial completo
                            </button>
                        </CardContent>
                    </Card>
                </div>
            </section>

        </div>
    );
};

export default DashboardView;
