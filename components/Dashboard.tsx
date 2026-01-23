
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LabelList, Cell, PieChart, Pie, Legend
} from 'recharts';
import { DeviationRecord, MONTH_MAP } from '../types';
import { exportToExcel } from '../services/excelService';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  LayoutGrid, 
  Printer, 
  FileSpreadsheet, 
  LayoutDashboard,
  BarChart2,
  PieChart as PieIcon,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  data: DeviationRecord[];
}

const COLORS = ['#0e4b61', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#4ade80', '#fb7185', '#60a5fa'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [filters, setFilters] = useState({
    motorista: 'TODOS',
    status: 'TODOS',
    mes: 'TODOS',
    tratativa: 'TODOS'
  });

  // Dados filtrados conforme seleção do usuário
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(r => {
      const matchMotorista = filters.motorista === 'TODOS' || r.MOTORISTAS === filters.motorista;
      const matchStatus = filters.status === 'TODOS' || r.STATUS === filters.status;
      const matchMes = filters.mes === 'TODOS' || r["MÊS"] === filters.mes;
      const matchTratativa = filters.tratativa === 'TODOS' || r.TRATATIVA === filters.tratativa;
      return matchMotorista && matchStatus && matchMes && matchTratativa;
    });
  }, [data, filters]);

  // Opções para os selects (Corrigido para evitar crash)
  const options = useMemo(() => {
    return {
      motoristas: ['TODOS', ...Array.from(new Set(data.map(r => r.MOTORISTAS)))].filter(Boolean).sort(),
      status: ['TODOS', ...Array.from(new Set(data.map(r => r.STATUS)))].filter(Boolean).sort(),
      meses: ['TODOS', ...Array.from(new Set(data.map(r => r["MÊS"])))].filter(Boolean).sort((a: string, b: string) => (MONTH_MAP[a] || 0) - (MONTH_MAP[b] || 0)),
      tratativas: ['TODOS', ...Array.from(new Set(data.map(r => r.TRATATIVA)))].filter(Boolean).sort()
    };
  }, [data]);

  const kpis = useMemo(() => {
    const totalDesvios = filteredData.reduce((acc, curr) => acc + (Number(curr.QTD) || 0), 0);
    const totalTratados = filteredData.filter(r => r.TRATADO === 'SIM').reduce((acc, curr) => acc + (Number(curr.QTD) || 0), 0);
    const percTratado = totalDesvios > 0 ? (totalTratados / totalDesvios * 100).toFixed(1) : 0;

    const motoristaCounts: Record<string, number> = {};
    const desvioCounts: Record<string, number> = {};
    
    filteredData.forEach(r => {
      const qtd = Number(r.QTD) || 0;
      const motorista = r.MOTORISTAS || "DESCONHECIDO";
      const tipo = (r["TIPO DE DESVIO"] || "NÃO INFORMADO").trim().toUpperCase();
      
      motoristaCounts[motorista] = (motoristaCounts[motorista] || 0) + qtd;
      desvioCounts[tipo] = (desvioCounts[tipo] || 0) + qtd;
    });

    const topMotorista = Object.entries(motoristaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    const topDesvio = Object.entries(desvioCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return { totalDesvios, percTratado, topMotorista, topDesvio };
  }, [filteredData]);

  // AGRUPAMENTO PRINCIPAL: Soma QTD por Tipo de Desvio
  const summaryByTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(r => {
      const type = (r["TIPO DE DESVIO"] || "NÃO INFORMADO").trim().toUpperCase();
      counts[type] = (counts[type] || 0) + (Number(r.QTD) || 0);
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const topMotoristasData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(r => {
      counts[r.MOTORISTAS] = (counts[r.MOTORISTAS] || 0) + (Number(r.QTD) || 0);
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredData]);

  if (data.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-gray-400">
        <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-bold">Nenhum dado disponível para o Dashboard.</p>
        <p className="text-sm">Importe uma planilha na aba de "Edição" para visualizar os gráficos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-blue-50 rounded-lg">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
           </div>
           <h2 className="text-lg font-bold text-gray-800">Indicadores de Desvios</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToExcel(data, filteredData)} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-900 transition-colors">
            <Printer className="w-4 h-4" /> Imprimir PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Mês</label>
          <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none" value={filters.mes} onChange={e => setFilters(f => ({...f, mes: e.target.value}))}>
            {options.meses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Motorista</label>
          <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none" value={filters.motorista} onChange={e => setFilters(f => ({...f, motorista: e.target.value}))}>
            {options.motoristas.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Status</label>
          <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none" value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))}>
            {options.status.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Tratativa</label>
          <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none" value={filters.tratativa} onChange={e => setFilters(f => ({...f, tratativa: e.target.value}))}>
            {options.tratativas.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Total Desvios (QTD)</span>
          <div className="text-2xl font-black text-[#0e4b61]">{kpis.totalDesvios}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Eficiência</span>
          <div className="text-2xl font-black text-emerald-600">{kpis.percTratado}%</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Tipo Predominante</span>
          <div className="text-xs font-bold text-gray-700 truncate">{kpis.topDesvio}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Motorista Crítico</span>
          <div className="text-xs font-bold text-gray-700 truncate">{kpis.topMotorista}</div>
        </div>
      </div>

      {/* Gráfico de Barras Principal (Soma por Tipo) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-black text-[#0e4b61] uppercase flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" /> Soma de QTD por Tipo de Desvio
            </h3>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryByTypeData} layout="vertical" margin={{ left: 40, right: 60 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={180} fontSize={10} tick={{ fill: '#1f2937', fontWeight: '800' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={28}>
                  {summaryByTypeData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  <LabelList dataKey="value" position="right" style={{ fontSize: '12px', fontWeight: '900', fill: '#0e4b61' }} offset={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-base font-black text-[#0e4b61] uppercase mb-8 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-orange-500" /> Distribuição %
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summaryByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                   {summaryByTypeData.map((_, index) => <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ranking de Motoristas */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-black text-[#0e4b61] mb-6 uppercase flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" /> Top 10 Motoristas (Soma de QTD)
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topMotoristasData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={10} tick={{ fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" fill="#0e4b61" radius={[8, 8, 0, 0]} barSize={40}>
                <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fontWeight: '900', fill: '#0e4b61' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
