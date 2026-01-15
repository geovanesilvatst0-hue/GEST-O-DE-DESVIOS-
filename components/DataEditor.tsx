
import React from 'react';
import { DeviationRecord } from '../types';
import { Trash2, Plus, AlertCircle, CheckCircle2, ChevronDown, Filter } from 'lucide-react';

interface DataEditorProps {
  data: DeviationRecord[];
  onUpdate: (newData: DeviationRecord[]) => void;
}

const DataEditor: React.FC<DataEditorProps> = ({ data, onUpdate }) => {
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
    onUpdate(data.filter(item => item.id !== id));
  };

  // Reordenado conforme a imagem de referência
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
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-sm font-bold text-gray-700">Edição de Registros ({data.length})</h2>
        <button 
          onClick={addRow}
          className="flex items-center gap-2 bg-[#0e4b61] hover:bg-[#0a3646] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
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
            {data.map((row) => (
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
                  <input 
                    type="text" 
                    value={row["TIPO DE DESVIO"]} 
                    onChange={e => handleCellChange(row.id, 'TIPO DE DESVIO', e.target.value)}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none"
                  />
                </td>
                <td className="p-1 border-r border-gray-50">
                  <input 
                    type="number" 
                    value={row.QTD} 
                    onChange={e => handleCellChange(row.id, 'QTD', parseInt(e.target.value))}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none"
                  />
                </td>
                <td className="p-1 border-r border-gray-50">
                  <input 
                    type="text" 
                    value={row["MÊS"]} 
                    onChange={e => handleCellChange(row.id, 'MÊS', e.target.value.toUpperCase())}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none"
                  />
                </td>
                <td className="p-1 border-r border-gray-50">
                  <select 
                    value={row.TRATADO} 
                    onChange={e => handleCellChange(row.id, 'TRATADO', e.target.value)}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none"
                  >
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </td>
                <td className="p-1 border-r border-gray-50">
                  <input 
                    type="text" 
                    value={row.TRATATIVA} 
                    onChange={e => handleCellChange(row.id, 'TRATATIVA', e.target.value)}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none"
                  />
                </td>
                <td className="p-1 border-r border-gray-50">
                  <input 
                    type="date" 
                    value={row.DATA} 
                    onChange={e => handleCellChange(row.id, 'DATA', e.target.value)}
                    className="w-full p-2 bg-transparent focus:bg-white border border-transparent focus:border-cyan-200 rounded outline-none"
                  />
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
