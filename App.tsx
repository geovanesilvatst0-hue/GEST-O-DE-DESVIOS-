
import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { DeviationRecord } from './types';
import { cleanData, exportToExcel } from './services/excelService';
import DataEditor from './components/DataEditor';
import Dashboard from './components/Dashboard';
import { 
  FileUp, 
  Download, 
  RefreshCw, 
  LayoutDashboard, 
  Table as TableIcon,
  Truck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<DeviationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('editor');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet);
      
      const { cleaned } = cleanData(rawData);
      setData(cleaned);
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleApplyTreatment = () => {
    const { cleaned } = cleanData(data);
    setData(cleaned);
    alert("Dados tratados com sucesso!");
  };

  const handleExport = () => {
    if (data.length === 0) return;
    exportToExcel(data, data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 print:bg-white">
      {/* Header - Oculto na Impressão */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Gestor de Desvios</h1>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Controle de Motoristas v1.0</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors">
            <FileUp className="w-4 h-4" />
            Upload Excel
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </label>

          <button 
            onClick={handleApplyTreatment}
            disabled={data.length === 0}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Tratar Dados
          </button>

          <button 
            onClick={handleExport}
            disabled={data.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Salvar e Exportar Geral
          </button>
        </div>
      </header>

      {/* Navigation Tabs - Oculto na Impressão */}
      <div className="bg-white border-b border-gray-200 px-6 no-print">
        <nav className="flex gap-8">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`py-4 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'editor' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <TableIcon className="w-4 h-4" /> Tabela de Edição
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-hidden print:p-0 print:overflow-visible">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-pulse no-print">
            <RefreshCw className="w-12 h-12 mb-4 animate-spin text-blue-600" />
            <p className="font-semibold">Processando arquivo...</p>
          </div>
        ) : (
          <div className="h-full">
            {activeTab === 'editor' ? (
              <DataEditor data={data} onUpdate={setData} />
            ) : (
              <div className="h-full overflow-y-auto pr-2 custom-scrollbar print:overflow-visible print:pr-0">
                <Dashboard data={data} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Tooltip / Footer - Oculto na Impressão */}
      <footer className="bg-gray-50 border-t border-gray-100 p-3 text-center text-xs text-gray-400 flex justify-center items-center gap-4 no-print">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Válido</span>
        <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-500" /> Incompleto</span>
        <span className="border-l border-gray-200 h-3 ml-2 pl-4">Desenvolvido para Gestão de Frotas</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          
          body, html {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }

          @page {
            size: A4;
            margin: 1cm;
          }

          .recharts-responsive-container {
            width: 100% !important;
            height: 300px !important;
          }

          /* Forçar cores de fundo na impressão */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
