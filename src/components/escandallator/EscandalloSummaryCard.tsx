import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportData {
    costo: number;
    baseImponible: number;
    ivaSoportado: number;
    margenBruto: number;
    rentabilidad: number;
    precioVenta: number;
}

interface EscandalloSummaryCardProps {
    recipeName: string;
    reportData: ReportData;
    pieData: { name: string; value: number }[];
    onSaveHistory: (reportData: ReportData) => void;
    onExport: () => void;
}

const COLORS = ['#ef4444', '#22c55e', '#64748b'];

const EscandalloSummaryCard: React.FC<EscandalloSummaryCardProps> = ({
    recipeName,
    reportData,
    pieData,
    onSaveHistory,
    onExport
}) => {
    return (
        <div>
            <div id="print-section">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="lg:col-span-1">
                        <CardHeader><CardTitle>Resultados: {recipeName}</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><p className="text-sm text-muted-foreground">Costo</p><p className="font-semibold text-lg">€{reportData.costo.toFixed(2)}</p></div>
                            <div className="space-y-1"><p className="text-sm text-muted-foreground">Base Imponible</p><p className="font-semibold text-lg">€{reportData.baseImponible.toFixed(2)}</p></div>
                            <div className="space-y-1"><p className="text-sm text-muted-foreground">Margen Bruto (€)</p><p className="font-semibold text-lg">€{reportData.margenBruto.toFixed(2)}</p></div>
                            <div className="space-y-1"><p className="text-sm text-muted-foreground">IVA Soportado</p><p className="font-semibold text-lg">€{reportData.ivaSoportado.toFixed(2)}</p></div>
                            <div className="space-y-1 col-span-2"><p className="text-sm text-muted-foreground">Rentabilidad (%)</p><p className="font-bold text-2xl text-primary">{reportData.rentabilidad.toFixed(2)}%</p></div>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-1">
                        <CardHeader><CardTitle>Distribución del PVP</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="flex gap-4 mt-4 no-print">
                <Button onClick={() => onSaveHistory(reportData)} className="w-full">Guardar en Historial</Button>
                <Button variant="outline" onClick={onExport} className="w-full">Exportar/Imprimir</Button>
            </div>
        </div>
    );
};

export default EscandalloSummaryCard;
