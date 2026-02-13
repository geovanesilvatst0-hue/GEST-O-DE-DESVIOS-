
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LabelList, Cell, PieChart, Pie, Legend
} from 'recharts';
import pptxgen from "pptxgenjs";
import { DeviationRecord, MONTH_MAP } from '../types';
import { exportToExcel } from '../services/excelService';
import { 
  AlertCircle, 
  FileSpreadsheet, 
  LayoutDashboard,
  BarChart2,
  PieChart as PieIcon,
  ClipboardCheck,
  Presentation,
  Loader2,
  MessageSquareText,
  UserCheck,
  Search,
  Truck,
  TrendingUp,
  Printer
} from 'lucide-react';

interface DashboardProps {
  data: DeviationRecord[];
}

/**
 * Formata nomes para o padrão "Title Case"
 * Converte "HELITON GUIMARAES" para "Heliton Guimaraes"
 */
const formatToTitleCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const COLORS = [
  '#0e4b61', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#4ade80', '#fb7185', '#60a5fa'
];

const STATUS_COLORS: Record<string, string> = {
  'SIM': '#10b981',
  'NÃO': '#ef4444'
};

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [filters, setFilters] = useState({
    motorista: 'TODOS',
    searchMotorista: '',
    tipoDesvio: 'TODOS',
    status: 'TODOS',
    mes: 'TODOS',
    tratativa: 'TODOS'
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(r => {
      const matchMotorista = filters.motorista === 'TODOS' || r.MOTORISTAS === filters.motorista;
      const matchSearch = !filters.searchMotorista || r.MOTORISTAS.toUpperCase().includes(filters.searchMotorista.toUpperCase());
      const matchTipo = filters.tipoDesvio === 'TODOS' || r["TIPO DE DESVIO"] === filters.tipoDesvio;
      const matchStatus = filters.status === 'TODOS' || r.STATUS === filters.status;
      const matchMes = filters.mes === 'TODOS' || r["MÊS"] === filters.mes;
      const matchTratativa = filters.tratativa === 'TODOS' || r.TRATATIVA === filters.tratativa;
      return matchMotorista && matchSearch && matchTipo && matchStatus && matchMes && matchTratativa;
    });
  }, [data, filters]);

  const options = useMemo(() => {
    return {
      motoristas: ['TODOS', ...Array.from(new Set(data.map(r => r.MOTORISTAS)))].filter(Boolean).sort(),
      status: ['TODOS', ...Array.from(new Set(data.map(r => r.STATUS)))].filter(Boolean).sort(),
      meses: ['TODOS', ...Array.from(new Set(data.map(r => r["MÊS"])))].filter(Boolean).sort((a: string, b: string) => (MONTH_MAP[a] || 0) - (MONTH_MAP[b] || 0)),
      tratativas: ['TODOS', ...Array.from(new Set(data.map(r => r.TRATATIVA)))].filter(Boolean).sort(),
      tiposDesvio: ['TODOS', ...Array.from(new Set(data.map(r => r["TIPO DE DESVIO"])))].filter(Boolean).sort()
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

    return { totalDesvios, percTratado, topMotorista: formatToTitleCase(topMotorista), topDesvio };
  }, [filteredData]);

  const driverTreatmentData = useMemo(() => {
    const driversMap: Record<string, { 
      name: string, 
      tratado: number, 
      pendente: number, 
      total: number,
      tratativas: string[],
      eventCounts: Record<string, number>
    }> = {};
    
    filteredData.forEach(r => {
      const name = r.MOTORISTAS || "N/A";
      const type = (r["TIPO DE DESVIO"] || "N/A").trim().toUpperCase();
      const qtd = Number(r.QTD) || 0;
      
      if (!driversMap[name]) {
        driversMap[name] = { 
          name: formatToTitleCase(name), 
          tratado: 0, 
          pendente: 0, 
          total: 0, 
          tratativas: [], 
          eventCounts: {} 
        };
      }
      
      if (r.TRATADO === 'SIM') {
        driversMap[name].tratado += qtd;
        if (r.TRATATIVA && !driversMap[name].tratativas.includes(r.TRATATIVA)) {
          driversMap[name].tratativas.push(r.TRATATIVA);
        }
      } else {
        driversMap[name].pendente += qtd;
      }
      
      driversMap[name].total += qtd;

      if (type) {
        driversMap[name].eventCounts[type] = (driversMap[name].eventCounts[type] || 0) + qtd;
      }
    });

    return Object.values(driversMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 50);
  }, [filteredData]);

  const deviationTypesPerDriver = useMemo(() => {
    const driversMap: Record<string, any> = {};
    const allTypes = new Set<string>();

    filteredData.forEach(r => {
      const name = r.MOTORISTAS || "N/A";
      const type = (r["TIPO DE DESVIO"] || "OUTROS").trim().toUpperCase();
      const qtd = Number(r.QTD) || 0;

      if (!driversMap[name]) {
        driversMap[name] = { name: formatToTitleCase(name) };
      }
      driversMap[name][type] = (driversMap[name][type] || 0) + qtd;
      allTypes.add(type);
    });

    return {
      data: Object.values(driversMap).sort((a: any, b: any) => {
        const sumA = Object.keys(a).reduce((acc, k) => k === 'name' ? acc : acc + a[k], 0);
        const sumB = Object.keys(b).reduce((acc, k) => k === 'name' ? acc : acc + b[k], 0);
        return sumB - sumA;
      }).slice(0, 50),
      types: Array.from(allTypes).sort()
    };
  }, [filteredData]);

  const finalTableData = useMemo(() => {
    if (!tableSearch.trim()) return driverTreatmentData;
    const term = tableSearch.toUpperCase().trim();
    return driverTreatmentData.filter(d => d.name.toUpperCase().includes(term));
  }, [driverTreatmentData, tableSearch]);

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

  const treatmentStats = useMemo(() => {
    const counts: Record<string, number> = { 'SIM': 0, 'NÃO': 0 };
    filteredData.forEach(r => {
      const status = String(r.TRATADO || 'NÃO').toUpperCase().trim();
      counts[status] = (counts[status] || 0) + (Number(r.QTD) || 0);
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const treatmentTypeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(r => {
      if (r.TRATATIVA) {
        const t = r.TRATATIVA.trim().toUpperCase();
        // Alterado para contar apenas a ocorrência (soma de tratativas) em vez de somar o QTD de desvios
        counts[t] = (counts[t] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const handleExportPpt = async () => {
    setIsExportingPpt(true);
    try {
      const pres = new pptxgen();
      pres.layout = "LAYOUT_16x9";
      let slideTitle = pres.addSlide();
      slideTitle.background = { fill: "0e4b61" };
      slideTitle.addText("RELATÓRIO DE DESVIOS", {
        x: 0.5, y: 1.5, w: 9, h: 1, color: "ffffff", fontSize: 32, bold: true, align: "center"
      });
      await pres.writeFile({ fileName: `Gestor_Desvios.pptx` });
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingPpt(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-gray-400">
        <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-bold">Nenhum dado disponível.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-blue-50 rounded-lg">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
           </div>
           <h2 className="text-lg font-bold text-gray-800">Painel de Indicadores</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPpt} disabled={isExportingPpt} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
            {isExportingPpt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />} Exportar PPT
          </button>
          <button onClick={() => exportToExcel(data, filteredData)} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-6 gap-4 no-print">
        <div className="md:col-span-1">
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Pesquisar</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Nome..." 
              value={filters.searchMotorista} 
              onChange={e => setFilters(f => ({...f, searchMotorista: e.target.value}))} 
              className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 outline-none focus:ring-1 focus:ring-blue-500 font-bold" 
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Mês</label>
          <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 outline-none font-bold" value={filters.mes} onChange={e => setFilters(f => ({...f, mes: e.target.value}))}>
            {options.meses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Tipo</label>
          <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 outline-none font-bold" value={filters.tipoDesvio} onChange={e => setFilters(f => ({...f, tipoDesvio: e.target.value}))}>
            {options.tiposDesvio.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Status</label>
          <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 outline-none font-bold" value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))}>
            {options.status.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Tratativa</label>
          <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 outline-none font-bold" value={filters.tratativa} onChange={e => setFilters(f => ({...f, tratativa: e.target.value}))}>
            {options.tratativas.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Total Desvios</span>
          <div className="text-2xl font-black text-[#0e4b61]">{kpis.totalDesvios}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Eficiência Tratativa</span>
          <div className="text-2xl font-black text-emerald-600">{kpis.percTratado}%</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Motorista Crítico</span>
          <div className="text-xs font-bold text-gray-700 truncate">{kpis.topMotorista}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Tipo Predominante</span>
          <div className="text-xs font-bold text-gray-700 truncate">{kpis.topDesvio}</div>
        </div>
      </div>

      {/* Gráfico 1: Tratativas por Motorista */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
           <div className="p-2 bg-emerald-50 rounded-lg">
            <UserCheck className="w-5 h-5 text-emerald-600" />
           </div>
           <div>
            <h3 className="text-base font-black text-[#0e4b61] uppercase leading-none">Status de Tratativas por Condutor</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Nomes alinhados milimetricamente abaixo de cada barra</p>
           </div>
        </div>

        <div className="w-full mb-10 overflow-x-auto custom-scrollbar">
          <div className="h-[600px]" style={{ minWidth: driverTreatmentData.length > 8 ? `${driverTreatmentData.length * 80}px` : '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverTreatmentData} margin={{ top: 20, right: 30, left: 20, bottom: 180 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={150} 
                  fontSize={11} 
                  interval={0} 
                  tick={{ fontWeight: '800', fill: '#4b5563' }} 
                  tickLine={{ stroke: '#e5e7eb' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickMargin={15}
                />
                <YAxis fontSize={10} tick={{ fontWeight: '800' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '30px' }} />
                <Bar dataKey="tratado" name="Tratado (SIM)" fill="#10b981" stackId="a" barSize={40} />
                <Bar dataKey="pendente" name="Pendente (NÃO)" fill="#ef4444" stackId="a" barSize={40} radius={[6, 6, 0, 0]}>
                   <LabelList dataKey="total" position="top" style={{ fontSize: '11px', fontWeight: '900', fill: '#0e4b61' }} offset={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico 2: Distribuição de Tipos por Motorista */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
           <div className="p-2 bg-blue-50 rounded-lg">
            <Truck className="w-5 h-5 text-blue-600" />
           </div>
           <div>
            <h3 className="text-base font-black text-[#0e4b61] uppercase leading-none">Volumetria de Desvios por Tipo</h3>
           </div>
        </div>

        <div className="w-full overflow-x-auto custom-scrollbar">
          <div className="h-[600px]" style={{ minWidth: deviationTypesPerDriver.data.length > 8 ? `${deviationTypesPerDriver.data.length * 80}px` : '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviationTypesPerDriver.data} margin={{ top: 20, right: 30, left: 20, bottom: 180 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={150} 
                  fontSize={11} 
                  interval={0} 
                  tick={{ fontWeight: '800', fill: '#4b5563' }} 
                  tickMargin={15}
                />
                <YAxis fontSize={10} tick={{ fontWeight: '800' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: '40px' }} />
                {deviationTypesPerDriver.types.map((type, idx) => (
                  <Bar key={type} dataKey={type} name={type} stackId="deviation" fill={COLORS[idx % COLORS.length]} barSize={35} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-[#0e4b61] mb-6 uppercase flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-500" /> Status Geral (QTD)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={treatmentStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                   {treatmentStats.map((entry, index) => (
                     <Cell key={`cell-status-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                   ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-[#0e4b61] mb-6 uppercase flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-blue-500" /> Distribuição por Tratativa
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={treatmentTypeStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                   {treatmentTypeStats.map((entry, index) => (
                     <Cell key={`cell-trat-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
