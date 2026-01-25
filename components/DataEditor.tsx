
import React, { useState, useMemo } from 'react';
import { DeviationRecord, MONTH_MAP } from '../types';
import { Trash2, Plus, AlertCircle, CheckCircle2, ChevronDown, Filter, Search, X, Calendar } from 'lucide-react';

interface DataEditorProps {
  data: DeviationRecord[];
  onUpdate: (newData: DeviationRecord[]) => void;
  onDelete: (id: string) => void;
}

const DataEditor: React.FC<DataEditorProps> = ({ data, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toUpperCase().trim();
    return data.filter(row => 
      row.MOTORISTAS.toUpperCase().includes(term)
    );
  }, [data, searchTerm]);

  const handleCellChange = (id: string, field: keyof DeviationRecord, value: any) => {
    const newData = data.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onUpdate(newData);
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
    onUpdate([newRow, ...data]);
  };

  const removeRow = (id: string) => {
    if (window.confirm("Tem certeza que deseja apagar este registro permanentemente?")) {
      onDelete(id);
    }
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

  const mesesOptions = Object.keys(MONTH_MAP);

  const desvioOptions = [
    "V-ACIMA DE 60 KM/H",
    "V-ACIMA DE 80 KM/H",
    "FRENAGEM BRUSCA",
    "USO DO CINTO",
    "USO DO CELULAR",
    "FADIGA",
    "DISTRAÇÃO",
    "OBSTRUÇÃO DE CÂMERA"
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-gray-50/50 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <h2 className="text-sm font-bold text-gray-700 whitespace-nowrap">Edição de Registros ({data.length})</h2>
          
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Pesquisar motorista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={addRow}
          className="flex items-center gap-2 bg-[#0e4b61] hover:bg-[#0a3646] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Adicionar Linha
        </button>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse table-fixed min-w-[1400px]">
          <thead className="bg-[#0e4b61] text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 shadow-md">
            <tr>
              <th className="p-3 border-r border-[#0a3646] w-14 text-center">VALID</th>
              {columns.map(col => (
                <th key={col.key} className="p-3 border-r border-[#0a3646] relative group">
                  <div className="flex items-center justify-between">
                    <span>{col.label}</span>
                    <div className="flex flex-col opacity-60 group-hover:opacity-100 transition-opacity">
                      {col.label === 'TIPO DE DESVIO' ? (
                        <Filter className="w-3 h-3 text-white bg-white/20 p-0.5 rounded" />
                      ) : col.label === 'DATA' ? (
                        <Calendar className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </th>
              ))}
              <th className="p-3 w-16 text-center">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-cyan-50/40 transition-colors border-b border-gray-100">
                <td className="p-3 text-center border-r border-gray-50">
                  {row.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
                  )}
                </td>
                <td className="p-1 border-r border-gray-50">
                  <input 
                    type="text" 
                    value={row.MOTORISTAS} 
                    onChange={e => handleCellChange(row.id, 'MOTORISTAS', e.target.value)}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none transition-all"
                  />
                </td>
                <td className="p-1 border-r border-gray-50">
                  <select 
                    value={row["TIPO DE DESVIO"]} 
                    onChange={e => handleCellChange(row.id, 'TIPO DE DESVIO', e.target.value)}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none cursor-pointer"
                  >
                    <option value="">- SELECIONAR -</option>
                    {desvioOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
                <td className="p-1 border-r border-gray-50">
                  <input 
                    type="number" 
                    value={row.QTD} 
                    onChange={e => handleCellChange(row.id, 'QTD', parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none"
                  />
                </td>
                <td className="p-1 border-r border-gray-50">
                  <select 
                    value={row["MÊS"]} 
                    onChange={e => handleCellChange(row.id, 'MÊS', e.target.value)}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none cursor-pointer"
                  >
                    <option value="">- SELECIONAR -</option>
                    {mesesOptions.map(mes => (
                      <option key={mes} value={mes}>{mes}</option>
                    ))}
                  </select>
                </td>
                <td className="p-1.5 border-r border-gray-50 text-center">
                  <select 
                    value={row.TRATADO} 
                    onChange={e => handleCellChange(row.id, 'TRATADO', e.target.value)}
                    className={`w-[85%] mx-auto px-3 py-1.5 border-2 border-white rounded-full outline-none cursor-pointer font-black text-black transition-all text-[11px] appearance-none text-center shadow-lg ${
                      row.TRATADO === 'SIM' 
                        ? 'bg-[#2eff7a] shadow-[0_0_12px_rgba(46,255,122,0.5)]' 
                        : 'bg-[#ff4b4b] shadow-[0_0_12px_rgba(255,75,75,0.5)]'
                    }`}
                  >
                    <option value="SIM" className="bg-white text-black font-bold">SIM</option>
                    <option value="NÃO" className="bg-white text-black font-bold">NÃO</option>
                  </select>
                </td>
                <td className="p-1 border-r border-gray-50">
                  <select 
                    value={row.TRATATIVA} 
                    onChange={e => handleCellChange(row.id, 'TRATATIVA', e.target.value)}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none cursor-pointer font-medium"
                  >
                    <option value="">-</option>
                    <option value="ADVERTÊNCIA">ADVERTÊNCIA</option>
                    <option value="RECICLAGEM">RECICLAGEM</option>
                    <option value="SUSPENSÃO">SUSPENSÃO</option>
                    <option value="DEMISSÃO">DEMISSÃO</option>
                    <option value="ORIENTAÇÃO">ORIENTAÇÃO</option>
                  </select>
                </td>
                <td className="p-1 border-r border-gray-50">
                  <div className="relative flex items-center group/date">
                    <input 
                      type="date" 
                      value={row.DATA} 
                      onChange={e => handleCellChange(row.id, 'DATA', e.target.value)}
                      onClick={(e) => (e.target as any).showPicker?.()}
                      className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none cursor-pointer"
                    />
                    <Calendar className="absolute right-2 w-3.5 h-3.5 text-gray-400 pointer-events-none group-hover/date:text-blue-500 transition-colors" />
                  </div>
                </td>
                <td className="p-1 border-r border-gray-50">
                  <input 
                    type="text" 
                    value={row.STATUS} 
                    onChange={e => handleCellChange(row.id, 'STATUS', e.target.value)}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none"
                  />
                </td>
                <td className="p-1 border-r border-gray-50">
                  <input 
                    type="text" 
                    value={row["APLICADO POR"]} 
                    onChange={e => handleCellChange(row.id, 'APLICADO POR', e.target.value)}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none"
                  />
                </td>
                <td className="p-3 text-center">
                  <button 
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredData.length === 0 && data.length > 0 && (
        <div className="p-10 text-center flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
          <Search className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-sm font-medium">Nenhum motorista encontrado para "{searchTerm}"</p>
        </div>
      )}
      {data.length === 0 && (
        <div className="p-20 text-center flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
          <AlertCircle className="w-16 h-16 mb-4 opacity-10" />
          <p className="text-sm font-medium">Nenhum dado carregado. Carregue um arquivo .xlsx para começar.</p>
        </div>
      )}
    </div>
  );
};

export default DataEditor;
