
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { DeviationRecord } from './types';
import { cleanData, exportToExcel } from './services/excelService';
import { fetchDeviations, upsertDeviations, deleteDeviation, onAuthStateChange, signOut, isSupabaseConfigured } from './services/supabaseService';
import DataEditor from './components/DataEditor';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
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
  Settings,
  Database,
  Copy,
  Check
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [data, setData] = useState<DeviationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('editor');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- 1. CRIAR A TABELA
CREATE TABLE deviations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "MOTORISTAS" TEXT,
  "TIPO DE DESVIO" TEXT,
  "QTD" INTEGER,
  "MÊS" TEXT,
  "TRATADO" TEXT,
  "TRATATIVA" TEXT,
  "DATA" DATE,
  "STATUS" TEXT,
  "APLICADO POR" TEXT,
  "ANO" INTEGER,
  "MES_NUM" INTEGER,
  "SEMANA" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- 2. HABILITAR SEGURANÇA (RLS)
ALTER TABLE deviations ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICA DE ACESSO TOTAL
CREATE POLICY "Acesso Total Autenticado" 
ON deviations FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);`;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const { data: { subscription } } = onAuthStateChange((session) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        handleSyncFromCloud();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const handleSyncFromCloud = async () => {
    if (!isSupabaseConfigured) return;
    setSyncing(true);
    try {
      const cloudData = await fetchDeviations();
      if (cloudData.length > 0) {
        setData(cloudData);
      }
    } catch (err: any) {
      console.warn("Falha ao sincronizar:", err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!isSupabaseConfigured || data.length === 0) {
      alert("Nenhum dado para salvar.");
      return;
    }
    setSyncing(true);
    try {
      await upsertDeviations(data);
      alert("✅ Dados salvos com sucesso no Supabase!");
    } catch (err: any) {
      console.error(err);
      alert(`❌ ERRO AO SALVAR:\n\n${err.message || 'Erro desconhecido'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // 1. Tenta apagar no banco de dados
      await deleteDeviation(id);
      // 2. Se deu certo no banco, remove da tela
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      // Se for um ID que ainda não estava no banco (recém criado na tela), removemos apenas da tela
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setData([]);
    } catch (err) {
      console.error("Erro ao sair.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Iniciando Sistema...</p>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e4b61] p-6 overflow-y-auto py-12">
        <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-2xl">
          <div className="bg-amber-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Configuração do Banco de Dados</h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            Para ativar a nuvem, configure as chaves no código e execute o script abaixo no seu Supabase.
          </p>

          <div className="space-y-6">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                  <Database className="w-3 h-3" /> Script SQL (Execute no "SQL Editor" do Supabase)
                </h3>
                <button 
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 text-[10px] font-bold bg-white border border-gray-200 px-2 py-1 rounded-md hover:bg-gray-100 transition-all text-gray-600"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado!' : 'Copiar Script'}
                </button>
              </div>
              <pre className="text-[10px] leading-relaxed font-mono bg-[#1e293b] text-blue-300 p-4 rounded-lg overflow-x-auto max-h-64 custom-scrollbar">
                {sqlCode}
              </pre>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#0e4b61] text-white font-bold py-3.5 rounded-xl hover:bg-[#0a3646] transition-all shadow-lg"
            >
              Já configurei, atualizar sistema
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 print:bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Gestor de Desvios</h1>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Controle de Frota Cloud v2.0</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl mr-2">
            <label className="flex items-center gap-2 hover:bg-white text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all">
              <FileUp className="w-3.5 h-3.5" />
              Importar
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
            </label>
            <button 
              onClick={handleSaveToCloud}
              disabled={data.length === 0 || syncing}
              className="flex items-center gap-2 hover:bg-white text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
              Salvar Nuvem
            </button>
          </div>

          <button 
            onClick={handleSyncFromCloud}
            disabled={syncing}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
            title="Atualizar da Nuvem"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-2">
             <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-0.5">Operador</span>
                <span className="text-xs font-bold text-gray-700 leading-none">{session.user.email?.split('@')[0]}</span>
             </div>
             <button 
                onClick={handleLogout}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all shadow-sm border border-rose-100"
                title="Sair do Sistema"
             >
                <LogOut className="w-4 h-4" />
             </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 px-6 no-print">
        <nav className="flex gap-8">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`py-4 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'editor' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <TableIcon className="w-4 h-4" /> Edição
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
        </nav>
      </div>

      <main className="flex-1 p-6 overflow-hidden print:p-0 print:overflow-visible">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-pulse no-print">
            <RefreshCw className="w-12 h-12 mb-4 animate-spin text-blue-600" />
            <p className="font-semibold">Processando...</p>
          </div>
        ) : (
          <div className="h-full">
            {activeTab === 'editor' ? (
              <DataEditor data={data} onUpdate={setData} onDelete={handleDelete} />
            ) : (
              <div className="h-full overflow-y-auto pr-2 custom-scrollbar print:overflow-visible print:pr-0">
                <Dashboard data={data} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 p-3 text-center text-[10px] text-gray-400 flex justify-center items-center gap-4 no-print font-bold uppercase tracking-widest">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Válido</span>
        <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-500" /> Erro</span>
        <span className="flex items-center gap-1 ml-4"><div className="w-2 h-2 rounded-full bg-green-500" /> Banco: Conectado</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
