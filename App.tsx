
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { DeviationRecord } from './types';
import { cleanData } from './services/excelService';
import { fetchDeviations, upsertDeviations, deleteDeviation, onAuthStateChange, signOut, isSupabaseConfigured, supabase } from './services/supabaseService';
import DataEditor from './components/DataEditor';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Toast, { ToastType } from './components/Toast';
import { 
  FileUp, 
  RefreshCw, 
  LayoutDashboard, 
  Table as TableIcon,
  Truck,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
  Loader2,
  LogOut,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [data, setData] = useState<DeviationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('editor');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'not_configured' | 'checking'>('checking');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Filtros globais para que o cabeçalho possa reagir
  const [filters, setFilters] = useState({
    motorista: '',
    desvio: '',
    mes: '',
    tratativa: ''
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const checkConnection = async () => {
    if (!isSupabaseConfigured) {
      setDbStatus('not_configured');
      return;
    }
    try {
      const { error } = await supabase!.from('deviations').select('id').limit(1);
      if (error) throw error;
      setDbStatus('connected');
    } catch (err) {
      console.error("Erro de conexão com DB:", err);
      setDbStatus('error');
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      setDbStatus('not_configured');
      return;
    }

    const { data: { subscription } } = onAuthStateChange((session) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        handleSyncFromCloud();
        checkConnection();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Totais que reagem aos filtros globais
  const totalsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Filtramos os dados antes de contar para o resumo do cabeçalho
    const filteredForSummary = data.filter(item => {
      const matchMotorista = !filters.motorista || (item.MOTORISTAS || '').toUpperCase().includes(filters.motorista.toUpperCase());
      const matchDesvio = !filters.desvio || item['TIPO DE DESVIO'] === filters.desvio;
      const matchMes = !filters.mes || item['MÊS'] === filters.mes;
      const matchTratativa = !filters.tratativa || item.TRATATIVA === filters.tratativa;
      return matchMotorista && matchDesvio && matchMes && matchTratativa;
    });

    filteredForSummary.forEach(item => {
      const type = (item["TIPO DE DESVIO"] || "N/A").trim().toUpperCase();
      counts[type] = (counts[type] || 0) + (Number(item.QTD) || 0);
    });
    return counts;
  }, [data, filters]);

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
      showToast("Planilha carregada com sucesso!");
    };
    reader.readAsBinaryString(file);
  };

  const handleSyncFromCloud = async () => {
    if (!isSupabaseConfigured) return;
    setSyncing(true);
    try {
      const cloudData = await fetchDeviations();
      if (cloudData.length > 0) setData(cloudData);
      setDbStatus('connected');
    } catch (err: any) {
      console.warn("Falha ao sincronizar:", err.message);
      setDbStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!isSupabaseConfigured || data.length === 0) return;
    setSyncing(true);
    try {
      await upsertDeviations(data);
      showToast("✅ Dados sincronizados na nuvem!");
      setDbStatus('connected');
    } catch (err: any) {
      showToast(`❌ Erro: ${err.message}`, 'error');
      setDbStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = useCallback((id: string) => {
    if (!id) return;
    setData(prev => prev.filter(item => item.id !== id));
    if (isSupabaseConfigured) {
      deleteDeviation(id).catch(err => {
        console.error("Erro na exclusão remota:", err);
      });
    }
    showToast("Registro removido com sucesso.");
  }, []);

  const handleLogout = async () => {
    await signOut();
    setData([]);
  };

  if (authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Iniciando...</p>
    </div>
  );

  if (!session) return <Login />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Gestor de Desvios</h1>
              <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                <div className={`w-2 h-2 rounded-full ${
                  dbStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                  dbStatus === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                  'bg-amber-500'
                }`} />
                <span className="text-[9px] font-black text-gray-400 uppercase">
                  {dbStatus === 'connected' ? 'Online' : dbStatus === 'error' ? 'Erro' : 'Offline'}
                </span>
              </div>
            </div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Cloud v2.6.0</p>
          </div>
        </div>

        {/* Resumo de Totais que agora responde aos filtros */}
        <div className="hidden xl:flex flex-1 justify-center px-8">
           <div className="flex gap-6 overflow-x-auto no-scrollbar py-1">
             {Object.entries(totalsByType).map(([type, total]) => (
               <div key={type} className="flex flex-col items-center min-w-[100px] border-r border-gray-100 last:border-none px-4">
                 <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter text-center leading-tight mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                   {type}
                 </span>
                 <span className="text-sm font-black text-[#0e4b61]">{total}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all">
            <FileUp className="w-4 h-4" /> Importar
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </label>
          <button onClick={handleSaveToCloud} disabled={data.length === 0 || syncing} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-md">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />} Salvar
          </button>
          <button onClick={handleLogout} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all border border-rose-100">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 px-6 no-print">
        <nav className="flex gap-8">
          <button onClick={() => setActiveTab('editor')} className={`py-4 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'editor' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <TableIcon className="w-4 h-4" /> Edição
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`py-4 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
        </nav>
      </div>

      <main className="flex-1 p-6 overflow-hidden">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-12 h-12 mb-4 animate-spin text-blue-600" />
            <p className="font-bold">Carregando dados...</p>
          </div>
        ) : (
          <div className="h-full">
            {activeTab === 'editor' ? (
              <DataEditor 
                data={data} 
                onUpdate={setData} 
                onDelete={handleDelete}
                filters={filters}
                onFilterChange={setFilters}
              />
            ) : (
              <Dashboard data={data} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
