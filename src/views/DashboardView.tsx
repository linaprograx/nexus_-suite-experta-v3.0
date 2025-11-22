import React from 'react';
import { Auth } from 'firebase/auth';
import { Recipe, PizarronTask, Ingredient, ViewName } from '../../types';
import { useApp } from '../../App';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { FaBook, FaBolt } from 'react-icons/fa';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import TodayTasks from '../components/dashboard/TodayTasks';

const DashboardView: React.FC<{
  allRecipes: Recipe[];
  allPizarronTasks: PizarronTask[];
  allIngredients: Ingredient[];
  auth: Auth;
  setCurrentView: (view: ViewName) => void;
}> = ({ allRecipes, allPizarronTasks, allIngredients, auth, setCurrentView }) => {
    const { userProfile } = useApp();

    const kpis = React.useMemo(() => {
        const totalRecipes = allRecipes.length;
        const totalTasks = allPizarronTasks.length;
        const tiempoAhorrado = (totalRecipes * 0.5) + (totalTasks * 0.25);
        return { totalRecipes, totalTasks, tiempoAhorrado };
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

        return Object.entries(activityByDate)
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [allRecipes, allPizarronTasks]);

    const balanceData = [
        { subject: 'Dulce', A: 8, fullMark: 10 },
        { subject: 'Cítrico', A: 9, fullMark: 10 },
        { subject: 'Amargo', A: 6, fullMark: 10 },
        { subject: 'Alcohol', A: 7, fullMark: 10 },
        { subject: 'Herbal', A: 5, fullMark: 10 },
        { subject: 'Especiado', A: 4, fullMark: 10 },
    ];

    const KPICard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`text-white p-2 rounded-full ${color}`}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-4 lg:p-8 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto min-h-screen pb-32">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Bienvenido, {userProfile?.displayName || auth.currentUser?.email}</h1>
                <p className="text-muted-foreground">Una vista de alto nivel del ecosistema Nexus.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="lg:col-span-2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl">
                    <CardHeader>
                        <CardTitle>Métrica de Impacto (ROI)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg">Tiempo Ahorrado (Estimado)</p>
                        <p className="text-6xl font-extrabold tracking-tighter">{kpis.tiempoAhorrado.toFixed(2)}</p>
                        <p className="text-lg">Horas Reales Ahorradas</p>
                    </CardContent>
                </Card>
                <div onClick={() => setCurrentView('grimorium')} className="cursor-pointer">
                    <KPICard title="Total Recetas" value={kpis.totalRecipes} icon={<FaBook size={24} />} color="bg-blue-500" />
                </div>
                <div onClick={() => setCurrentView('pizarron')} className="cursor-pointer">
                    <KPICard title="Total Tareas" value={kpis.totalTasks} icon={<FaBolt size={24} />} color="bg-green-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-lg">
                    <CardHeader>
                        <CardTitle>Tendencia Creativa</CardTitle>
                        <CardDescription>Actividad de creación por fecha.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={creativeTrendData}>
                                <defs>
                                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="recipes" stackId="1" stroke="#8884d8" fill="url(#colorUv)" name="Recetas" />
                                <Area type="monotone" dataKey="tasks" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Tareas" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Equilibrio de la Carta</CardTitle>
                        <CardDescription>Perfil de sabor general (simulado).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={balanceData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis />
                                <Radar name="Balance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <TodayTasks />
        </div>
    );
};

export default DashboardView;
