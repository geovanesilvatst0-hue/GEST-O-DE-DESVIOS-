
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LabelList, Cell, PieChart, Pie, Legend
} from 'recharts';
import pptxgen from "pptxgenjs";
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
  ChevronRight,
  ClipboardCheck,
  Presentation,
  Loader2
} from 'lucide-react';

interface DashboardProps {
  data: DeviationRecord[];
}

const COLORS = ['#0e4b61', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#4ade80', '#fb7185', '#60a5fa'];
const STATUS_COLORS: Record<string, string> = {
  'SIM': '#10b981', // Verde
  'NÃO': '#ef4444'  // Vermelho
};

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [filters, setFilters] = useState({
    motorista: 'TODOS',
    status: 'TODOS',
    mes: 'TODOS',
    tratativa: 'TODOS'
  });

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

  const handleExportPpt = async () => {
    setIsExportingPpt(true);
    try {
      const pres = new pptxgen();
      pres.layout = "LAYOUT_16x9";

      // 1. CAPA
      let slideTitle = pres.addSlide();
      slideTitle.background = { fill: "0e4b61" };
      slideTitle.addText("RELATÓRIO DE DESVIOS - FROTA", {
        x: 0.5, y: 1.5, w: 9, h: 1, color: "ffffff", fontSize: 32, bold: true, align: "center"
      });
      slideTitle.addText(`Filtros: Mês: ${filters.mes} | Motorista: ${filters.motorista} | Status: ${filters.status}`, {
        x: 0.5, y: 3.5, w: 9, h: 0.5, color: "ffffff", fontSize: 14, align: "center"
      });

      // 2. INDICADORES (KPIs)
      let slideKpi = pres.addSlide();
      slideKpi.addText("PRINCIPAIS INDICADORES", { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: "0e4b61" });
      
      const kpiBoxes = [
        { label: "Total Desvios", value: String(kpis.totalDesvios), color: "0e4b61", x: 0.5 },
        { label: "Eficiência", value: `${kpis.percTratado}%`, color: "10b981", x: 2.8 },
        { label: "Top Incidência", value: kpis.topDesvio, color: "f59e0b", x: 5.1 },
        { label: "Motorista Crítico", value: kpis.topMotorista, color: "ef4444", x: 7.4 }
      ];

      kpiBoxes.forEach(box => {
        slideKpi.addShape(pres.ShapeType.rect, { x: box.x, y: 1.5, w: 2.1, h: 1.5, fill: { color: box.color } });
        slideKpi.addText(box.label, { x: box.x, y: 1.6, w: 2.1, h: 0.4, color: "ffffff", fontSize: 10, align: "center", bold: true });
        slideKpi.addText(box.value, { x: box.x, y: 2.0, w: 2.1, h: 0.8, color: "ffffff", fontSize: 16, align: "center", bold: true });
      });

      // 3. GRÁFICO BARRAS TIPO DESVIO (Editável)
      let slideBar = pres.addSlide();
      slideBar.addText("SOMA DE QTD POR TIPO DE DESVIO", { x: 0.5, y: 0.5, fontSize: 20, bold: true, color: "0e4b61" });
      
      const barData = [{
        name: "Quantidade",
        labels: summaryByTypeData.map(d => d.name),
        values: summaryByTypeData.map(d => d.value)
      }];

      slideBar.addChart(pres.ChartType.bar, barData, {
        x: 0.5, y: 1.0, w: 9.0, h: 4.5,
        barDir: "bar", // horizontal
        showTitle: false,
        chartColors: COLORS,
        dataLabelFormatCode: "#",
        showValue: true,
        valAxisHidden: true,
        catAxisLabelFontSize: 9
      });

      // 4. GRÁFICO PIZZA DISTRIBUIÇÃO
      let slidePie = pres.addSlide();
      slidePie.addText("DISTRIBUIÇÃO PERCENTUAL POR TIPO", { x: 0.5, y: 0.5, fontSize: 20, bold: true, color: "0e4b61" });
      slidePie.addChart(pres.ChartType.pie, barData, {
        x: 1.5, y: 1.0, w: 7.0, h: 4.5,
        showLegend: true,
        legendPos: "r",
        showPercent: true,
        chartColors: COLORS
      });

      // 5. TOP MOTORISTAS
      let slideDrivers = pres.addSlide();
      slideDrivers.addText("TOP 10 MOTORISTAS (CRÍTICOS)", { x: 0.5, y: 0.5, fontSize: 20, bold: true, color: "0e4b61" });
      
      const driverData = [{
        name: "QTD Desvios",
        labels: topMotoristasData.map(d => d.name),
        values: topMotoristasData.map(d => d.value)
      }];

      slideDrivers.addChart(pres.ChartType.bar, driverData, {
        x: 0.5, y: 1.0, w: 9.0, h: 4.5,
        showValue: true,
        chartColors: ["0e4b61"],
        dataLabelFontSize: 10,
        catAxisLabelFontSize: 8
      });

      // 6. STATUS TRATATIVAS (O QUE VOCÊ PEDIU)
      let slideStatus = pres.addSlide();
      slideStatus.addText("STATUS DAS TRATATIVAS (SIM vs NÃO)", { x: 0.5, y: 0.5, fontSize: 20, bold: true, color: "0e4b61" });
      
      const statusData = [{
        name: "Status",
        labels: treatmentStats.map(d => d.name),
        values: treatmentStats.map(d => d.value)
      }];

      slideStatus.addChart(pres.ChartType.pie, statusData, {
        x: 2.0, y: 1.2, w: 6.0, h: 4.0,
        showLegend: true,
        legendPos: "b",
        showPercent: true,
        chartColors: ["10b981", "ef4444"]
      });

      await pres.writeFile({ fileName: `Dash_Desvios_${filters.mes}.pptx` });
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar PowerPoint");
    } finally {
      setIsExportingPpt(false);
    }
  };

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
          <button 
            onClick={handleExportPpt}
            disabled={isExportingPpt}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {isExportingPpt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />} 
            Exportar PowerPoint
          </button>
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

      {/* Gráfico de Barras Principal e Pizza de Distribuição */}
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
            <PieIcon className="w-5 h-5 text-orange-500" /> Distribuição % por Tipo
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

      {/* RODAPÉ DO DASHBOARD: Ranking de Motoristas e Gráfico de Tratativas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gráfico de Status de Tratativa */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-[#0e4b61] mb-6 uppercase flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-500" /> Status das Tratativas (QTD Total)
          </h3>
          <div className="h-[300px] flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={treatmentStats} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100} 
                  label={({ name, value }) => `${name}: ${value}`}
                >
                   {treatmentStats.map((entry, index) => (
                     <Cell key={`cell-status-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                   ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
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
    </div>
  );
};

export default Dashboard;
