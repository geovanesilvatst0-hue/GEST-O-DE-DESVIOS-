
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LabelList
} from 'recharts';
import { DeviationRecord, MONTH_MAP } from '../types';
import { exportToExcel } from '../services/excelService';
import pptxgen from "pptxgenjs";
import { 
  Filter, 
  PieChart as PieIcon, 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  LayoutGrid, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  LayoutDashboard,
  Presentation,
  Loader2
} from 'lucide-react';

interface DashboardProps {
  data: DeviationRecord[];
}

const COLORS = ['#0e4b61', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#4ade80', '#fb7185', '#60a5fa'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    motorista: 'TODOS',
    status: 'TODOS',
    mes: 'TODOS',
    tratativa: 'TODOS'
  });

  const filteredData = useMemo(() => {
    return data.filter(r => {
      const matchMotorista = filters.motorista === 'TODOS' || r.MOTORISTAS === filters.motorista;
      const matchStatus = filters.status === 'TODOS' || r.STATUS === filters.status;
      const matchMes = filters.mes === 'TODOS' || r["MÊS"] === filters.mes;
      const matchTratativa = filters.tratativa === 'TODOS' || r.TRATATIVA === filters.tratativa;
      return matchMotorista && matchStatus && matchMes && matchTratativa && r.isValid;
    });
  }, [data, filters]);

  const options = useMemo(() => {
    const validData = data.filter(r => r.isValid);
    return {
      motoristas: ['TODOS', ...Array.from(new Set(validData.map(r => r.MOTORISTAS)))].sort(),
      status: ['TODOS', ...Array.from(new Set(validData.map(r => r.STATUS)))].sort(),
      meses: ['TODOS', ...Array.from(new Set(validData.map(r => r["MÊS"])))].sort((a: string, b: string) => (MONTH_MAP[a] || 0) - (MONTH_MAP[b] || 0)),
      tratativas: ['TODOS', ...Array.from(new Set(validData.map(r => r.TRATATIVA)))].sort()
    };
  }, [data]);

  const kpis = useMemo(() => {
    const totalRegistros = filteredData.length;
    const totalDesvios = filteredData.reduce((acc, curr) => acc + (Number(curr.QTD) || 0), 0);
    const totalTratados = filteredData.filter(r => r.TRATADO === 'SIM').length;
    const percTratado = totalRegistros > 0 ? (totalTratados / totalRegistros * 100).toFixed(1) : 0;

    const motoristaCounts: Record<string, number> = {};
    const desvioCounts: Record<string, number> = {};
    
    filteredData.forEach(r => {
      motoristaCounts[r.MOTORISTAS] = (motoristaCounts[r.MOTORISTAS] || 0) + Number(r.QTD);
      desvioCounts[r["TIPO DE DESVIO"]] = (desvioCounts[r["TIPO DE DESVIO"]] || 0) + Number(r.QTD);
    });

    const topMotorista = Object.entries(motoristaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    const topDesvio = Object.entries(desvioCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return { totalRegistros, totalDesvios, percTratado, topMotorista, topDesvio };
  }, [filteredData]);

  const chartsPerType = useMemo(() => {
    const types = Array.from(new Set(filteredData.map(r => r["TIPO DE DESVIO"]))).sort();
    const mesesBase = options.meses.filter(m => m !== 'TODOS');

    return types.map(type => {
      const evolution = mesesBase.map(mes => {
        const total = filteredData
          .filter(r => r["TIPO DE DESVIO"] === type && r["MÊS"] === mes)
          .reduce((acc, curr) => acc + Number(curr.QTD), 0);
        return { name: mes, value: total };
      });

      const totalType = evolution.reduce((acc, curr) => acc + curr.value, 0);

      return { type, evolution, totalType };
    });
  }, [filteredData, options.meses]);

  const topMotoristasData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(r => {
      counts[r.MOTORISTAS] = (counts[r.MOTORISTAS] || 0) + Number(r.QTD);
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredData]);

  const handleExportFiltered = () => {
    if (filteredData.length === 0) return;
    exportToExcel(filteredData, filteredData);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPPT = async () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      const pres = new pptxgen();
      pres.layout = "LAYOUT_WIDE";

      // 1. Slide de Capa
      let slide1 = pres.addSlide();
      slide1.background = { color: "0e4b61" };
      slide1.addText("RELATÓRIO DE DESVIOS - EDITÁVEL", {
        x: 0, y: 2, w: "100%", fontSize: 36, color: "FFFFFF", bold: true, align: "center"
      });
      slide1.addText(`Analíticos de Frota | ${new Date().toLocaleDateString('pt-BR')}`, {
        x: 0, y: 3, w: "100%", fontSize: 18, color: "CCCCCC", align: "center"
      });
      slide1.addText(`Filtros Ativos: ${filters.motorista} / ${filters.mes}`, {
        x: 0, y: 5, w: "100%", fontSize: 12, color: "FFFFFF", align: "center"
      });

      // 2. Slide de Ranking (Gráfico de Barras Horizontal Editável)
      let slide2 = pres.addSlide();
      slide2.addText("TOP 10 MOTORISTAS (EDITÁVEL)", { x: 0.5, y: 0.4, fontSize: 24, bold: true, color: "0e4b61" });
      
      const chartDataTop = [
        {
          name: "QTD Desvios",
          labels: topMotoristasData.map(m => m.name),
          values: topMotoristasData.map(m => m.value)
        }
      ];

      slide2.addChart(pres.ChartType.bar, chartDataTop, {
        x: 0.5, y: 1.2, w: 9, h: 4.5,
        barDir: "bar", // Horizontal
        showValue: true,
        valGridLine: { style: "none" },
        chartColors: ["0e4b61"],
        dataLabelColor: "0e4b61",
        dataLabelFontSize: 10,
        dataLabelPosition: "outEnd"
      });

      // 3. Slides para cada Tipo de Desvio (Gráficos Editáveis)
      chartsPerType.forEach((item, index) => {
        let slideType = pres.addSlide();
        slideType.addText(`ANÁLISE: ${item.type}`, { x: 0.5, y: 0.4, fontSize: 20, bold: true, color: "0e4b61" });
        slideType.addText(`Total Acumulado: ${item.totalType}`, { x: 7, y: 0.4, fontSize: 14, color: "666666", align: "right" });

        const chartDataType = [
          {
            name: "Quantidade",
            labels: item.evolution.map(e => e.name),
            values: item.evolution.map(e => e.value)
          }
        ];

        slideType.addChart(pres.ChartType.bar, chartDataType, {
          x: 0.5, y: 1.2, w: 9, h: 4,
          barDir: "col", // Vertical
          showValue: true,
          valGridLine: { style: "dash" },
          chartColors: [COLORS[index % COLORS.length].replace('#', '')],
          dataLabelColor: "333333",
          dataLabelFontSize: 11,
          dataLabelPosition: "outEnd"
        });

        // Adiciona a tabelinha de apoio no canto inferior
        const miniTable = [
          ["Mês", "QTD"],
          ...item.evolution.map(ev => [ev.name, String(ev.value)])
        ];
        slideType.addTable(miniTable, {
          x: 0.5, y: 5.3, w: 9, 
          fontSize: 9, 
          border: { pt: 1, color: "EEEEEE" },
          fill: "F9F9F9"
        });
      });

      // 4. Slide Final de Dados Brutos (Tabela)
      let slideFinal = pres.addSlide();
      slideFinal.addText("DETALHAMENTO CONSOLIDADO", { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: "0e4b61" });
      const summaryTable = [
        ["Tipo de Desvio", "Total QTD", "Impacto %"],
        ...chartsPerType.map(item => [
          item.type, 
          String(item.totalType), 
          `${((item.totalType / (kpis.totalDesvios || 1)) * 100).toFixed(1)}%`
        ])
      ];
      slideFinal.addTable(summaryTable, {
        x: 0.5, y: 1.2, w: 9,
        border: { pt: 1, color: "CCCCCC" },
        fill: { color: "FFFFFF" },
        fontSize: 10,
        autoPage: true
      });

      await pres.writeFile({ fileName: `Apresentacao_Editavel_Desvios_${new Date().toISOString().split('T')[0]}.pptx` });
    } catch (error) {
      console.error("Erro na exportação PPT:", error);
      alert("Erro ao gerar PowerPoint editável. Verifique os dados.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header de Ações do Dashboard - Oculto na Impressão */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-blue-50 rounded-lg">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
           </div>
           <h2 className="text-lg font-bold text-gray-800">Relatório Executivo</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportFiltered}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-emerald-200"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={handleExportPPT}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-amber-200 shadow-sm ${
              isExporting ? 'bg-amber-100 text-amber-400 cursor-not-allowed' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
            {isExporting ? 'Gerando PPT Editável...' : 'Exportar PPT (Gráficos Editáveis)'}
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-900 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Printer className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Filters - Oculto na Impressão */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end no-print">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Filtrar Motorista</label>
          <select 
            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#0e4b61] outline-none"
            value={filters.motorista}
            onChange={e => setFilters(prev => ({...prev, motorista: e.target.value}))}
          >
            {options.motoristas.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Filtrar Mês</label>
          <select 
            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#0e4b61] outline-none"
            value={filters.mes}
            onChange={e => setFilters(prev => ({...prev, mes: e.target.value}))}
          >
            {options.meses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Status</label>
          <select 
            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#0e4b61] outline-none"
            value={filters.status}
            onChange={e => setFilters(prev => ({...prev, status: e.target.value}))}
          >
            {options.status.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Tratativa</label>
          <select 
            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#0e4b61] outline-none"
            value={filters.tratativa}
            onChange={e => setFilters(prev => ({...prev, tratativa: e.target.value}))}
          >
            {options.tratativas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 print-grid p-2">
        {[
          { label: 'Registros', value: kpis.totalRegistros, icon: <AlertCircle className="w-5 h-5 text-[#0e4b61]" />, color: 'bg-cyan-50' },
          { label: 'Total QTD', value: kpis.totalDesvios, icon: <BarChart3 className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50' },
          { label: 'Top Motorista', value: kpis.topMotorista, icon: <Users className="w-5 h-5 text-amber-600" />, color: 'bg-amber-50', small: true },
          { label: '% Tratado', value: `${kpis.percTratado}%`, icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50' },
          { label: 'Top Desvio', value: kpis.topDesvio, icon: <LayoutGrid className="w-5 h-5 text-rose-600" />, color: 'bg-rose-50', small: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:border-[#0e4b61]/30 transition-colors print:shadow-none print:border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{kpi.label}</span>
              <div className={`p-1.5 rounded-lg ${kpi.color} no-print`}>{kpi.icon}</div>
            </div>
            <div className={`font-bold text-gray-800 ${kpi.small ? 'text-xs truncate' : 'text-xl'}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* SEÇÃO: Gráfico para CADA tipo de desvio */}
      <div className="print:mt-8">
        <h3 className="text-sm font-bold text-[#0e4b61] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <LayoutGrid className="w-4 h-4 no-print" /> Análise por Tipo de Desvio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:grid-cols-2 p-2">
          {chartsPerType.map((item, index) => (
            <div key={item.type} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow group print:break-inside-avoid print:shadow-none">
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col max-w-[70%]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Tipo de Desvio</span>
                  <span className="text-xs font-black text-[#0e4b61] uppercase leading-tight group-hover:text-cyan-700 truncate" title={item.type}>{item.type}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Total QTD</span>
                  <span className="text-lg font-black text-gray-800">{item.totalType}</span>
                </div>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={item.evolution} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, (dataMax: number) => Math.max(dataMax + 2, 5)]} />
                    <Tooltip 
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill={COLORS[index % COLORS.length]} 
                      radius={[4, 4, 0, 0]} 
                      name="Quantidade"
                    >
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        style={{ fontSize: '10px', fontWeight: '800', fill: '#374151' }} 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 10 Motoristas */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:break-inside-avoid print:mt-12">
        <h3 className="text-sm font-bold text-[#0e4b61] mb-6 flex items-center gap-2 uppercase tracking-wide">
          <Users className="w-4 h-4 no-print" /> Top 10 Motoristas com mais Desvios (QTD)
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={topMotoristasData} 
              layout="vertical" 
              margin={{ left: 20, right: 60, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" hide domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120} 
                fontSize={10} 
                tick={{ fill: '#6b7280', fontWeight: 'bold' }} 
              />
              <Tooltip cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" fill="#0e4b61" radius={[0, 4, 4, 0]} barSize={24}>
                <LabelList 
                  dataKey="value" 
                  position="right" 
                  style={{ fontSize: '12px', fontWeight: '900', fill: '#0e4b61' }} 
                  offset={10}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
