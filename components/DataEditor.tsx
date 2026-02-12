
import React, { useState, useMemo } from 'react';
import { DeviationRecord, MONTH_MAP } from '../types';
import { Trash2, Plus, AlertCircle, CheckCircle2, ChevronDown, Filter, Search, X, Calendar } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface DataEditorProps {
  data: DeviationRecord[];
  onUpdate: React.Dispatch<React.SetStateAction<DeviationRecord[]>>;
  onDelete: (id: string) => void;
  filters: { motorista: string; desvio: string; mes: string };
  onFilterChange: React.Dispatch<React.SetStateAction<{ motorista: string; desvio: string; mes: string }>>;
}

const DataEditor: React.FC<DataEditorProps> = ({ data, onUpdate, onDelete, filters, onFilterChange }) => {
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const deviationOptions = [
    "V-ACIMA DE 80 KM/H",
    "FRENAGEM BRUSCA",
    "V-ACIMA DE 60 KM/H",
    "FADIGA",
    "CELULAR"
  ];

  const filteredData = useMemo(() => {
    let result = data;
    if (filters.motorista.trim()) {
      const term = filters.motorista.toUpperCase().trim();
      result = result.filter(row => (row.MOTORISTAS || '').toUpperCase().includes(term));
    }
    if (filters.desvio) {
      result = result.filter(row => row['TIPO DE DESVIO'] === filters.desvio);
    }
    if (filters.mes) {
      result = result.filter(row => row['MÊS'] === filters.mes);
    }
    return result;
  }, [data, filters]);

  const handleCellChange = (id: string, field: keyof DeviationRecord, value: any) => {
    onUpdate(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addRow = () => {
    const newRow: DeviationRecord = {
      id: crypto.randomUUID(),
      MOTORISTAS: '',
      'TIPO DE DESVIO': '',
      QTD: 1,
      'MÊS': '',
      TRATADO: 'NÃO',
      TRATATIVA: '',
      DATA: new Date().toISOString().split('T')[0],
      STATUS: '',
      'APLICADO POR': '',
      isValid: false
    };
    onUpdate(prev => [newRow, ...prev]);
  };

  const openDeleteModal = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      onDelete(deleteModal.id);
    }
    setDeleteModal({ isOpen: false, id: null });
  };

  const columns: { label: string; key: keyof DeviationRecord; type: string }[] = [
    { label: 'MOTORISTAS', key: 'MOTORISTAS', type: 'text' },
    { label: 'TIPO DE DESVIO', key: 'TIPO DE DESVIO', type: 'text' },
    { label: 'QTD', key: 'QTD', type: 'number' },
    { label: 'MÊS', key: 'MÊS', type: 'text' },
    { label: 'TRATADO', key: 'TRATADO', type: 'text' },
    { label: 'TRATATIVA', key: 'TRATATIVA', type: 'text' },
    { label: 'DATA', key: 'DATA', type: 'date' },
    { label: 'STATUS', key: 'STATUS', type: 'text' },
    { label: 'APLICADO POR', key: 'APLICADO POR', type: 'text' },
  ];

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-gray-50/50 gap-4 no-print">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-1">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Motorista..."
                  value={filters.motorista}
                  onChange={(e) => onFilterChange(prev => ({ ...prev, motorista: e.target.value }))}
                  className="w-full pl-9 pr-8 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 font-bold shadow-sm"
                />
              </div>
              <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select 
                  value={filters.desvio}
                  onChange={(e) => onFilterChange(prev => ({ ...prev, desvio: e.target.value }))}
                  className="w-full pl-9 pr-8 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 font-bold shadow-sm appearance-none cursor-pointer"
                >
                  <option value="">Filtrar Desvio...</option>
                  {deviationOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select 
                  value={filters.mes}
                  onChange={(e) => onFilterChange(prev => ({ ...prev, mes: e.target.value }))}
                  className="w-full pl-9 pr-8 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 font-bold shadow-sm appearance-none cursor-pointer"
                >
                  <option value="">Filtrar Mês...</option>
                  {Object.keys(MONTH_MAP).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <button onClick={addRow} className="flex items-center gap-2 bg-[#0e4b61] hover:bg-[#0a3646] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap">
            <Plus className="w-4 h-4" /> Adicionar Linha
          </button>
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed min-w-[1400px]">
            <thead className="bg-[#0e4b61] text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-20">
              <tr>
                <th className="p-3 w-14 text-center">OK</th>
                {columns.map(col => (
                  <th key={col.key} className="p-3 border-r border-[#0a3646]">
                    {col.label}
                  </th>
                ))}
                <th className="p-3 w-24 text-center">EXCLUIR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-3 text-center border-r border-gray-50">
                    {row.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
                    )}
                  </td>
                  <td className="p-1 border-r border-gray-50">
                    <input type="text" value={row.MOTORISTAS} onChange={e => handleCellChange(row.id, 'MOTORISTAS', e.target.value)} className="w-full p-2 bg-transparent text-gray-900 focus:bg-white outline-none rounded" />
                  </td>
                  <td className="p-1 border-r border-gray-50">
                    <select 
                      value={row["TIPO DE DESVIO"]} 
                      onChange={e => handleCellChange(row.id, 'TIPO DE DESVIO', e.target.value)} 
                      className="w-full p-2 bg-transparent text-gray-900 focus:bg-white outline-none rounded cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {deviationOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      {row["TIPO DE DESVIO"] && !deviationOptions.includes(row["TIPO DE DESVIO"]) && (
                        <option value={row["TIPO DE DESVIO"]}>{row["TIPO DE DESVIO"]}</option>
                      )}
                    </select>
                  </td>
                  <td className="p-1 border-r border-gray-50">
                    <input type="number" value={row.QTD} onChange={e => handleCellChange(row.id, 'QTD', parseInt(e.target.value) || 0)} className="w-full p-2 bg-transparent text-gray-900 focus:bg-white outline-none rounded" />
                  </td>
                  <td className="p-1 border-r border-gray-50">
                    <select value={row["MÊS"]} onChange={e => handleCellChange(row.id, 'MÊS', e.target.value)} className="w-full p-2 bg-transparent text-gray-900 focus:bg-white outline-none rounded">
                      <option value="">-</option>
                      {Object.keys(MONTH_MAP).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </td>
                  <td className="p-1.5 border-r border-gray-50 text-center">
                    <select 
                      value={row.TRATADO} 
                      onChange={e => handleCellChange(row.id, 'TRATADO', e.target.value)}
                      className={`px-3 py-1 rounded-full font-bold text-[10px] appearance-none text-center ${row.TRATADO === 'SIM' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                    >
                      <option value="SIM">SIM</option>
                      <option value="NÃO">NÃO</option>
                    </select>
                  </td>
                  <td className="p-1 border-r border-gray-50">
                    <input type="text" value={row.TRATATIVA} onChange={e => handleCellChange(row.id, 'TRATATIVA', e.target.value)} className="w-full p-2 bg-transparent text-gray-900 focus:bg-white outline-none rounded" />
                  </td>
                  <td className="p-1 border-r border-gray-50 text-center">
                     <input type="date" value={row.DATA} onChange={e => handleCellChange(row.id, 'DATA', e.target.value)} className="p-1 text-xs border-none bg-transparent text-gray-900" />
                  </td>
                  <td className="p-1 border-r border-gray-50">
                    <input type="text" value={row.STATUS} onChange={e => handleCellChange(row.id, 'STATUS', e.target.value)} className="w-full p-2 bg-transparent text-gray-900 focus:bg-white outline-none rounded" />
                  </td>
                  <td className="p-1 border-r border-gray-50">
                    <input type="text" value={row["APLICADO POR"]} onChange={e => handleCellChange(row.id, 'APLICADO POR', e.target.value)} className="w-full p-2 bg-transparent text-gray-900 focus:bg-white outline-none rounded" />
                  </td>
                  <td className="p-2 text-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openDeleteModal(row.id);
                      }}
                      className="p-3 text-gray-400 hover:text-white hover:bg-rose-600 rounded-xl transition-all active:scale-95 inline-flex items-center justify-center cursor-pointer border border-transparent hover:border-rose-200 bg-white"
                      title="Remover linha"
                    >
                      <Trash2 className="w-5 h-5 pointer-events-none" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length === 0 && (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
             <AlertCircle className="w-10 h-10 opacity-20" />
             <p className="font-bold text-sm uppercase">Nenhum registro para exibir</p>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        title="Excluir Registro"
        message="Tem certeza que deseja remover este desvio? Esta ação não poderá ser desfeita localmente."
        confirmText="Excluir Agora"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: null })}
      />
    </>
  );
};

export default DataEditor;
