
import * as XLSX from 'xlsx';
import { DeviationRecord, MonthName, MONTH_MAP, ValidationError } from '../types';

export const cleanData = (data: any[]): { cleaned: DeviationRecord[], errors: ValidationError[] } => {
  const cleaned: DeviationRecord[] = [];
  const errors: ValidationError[] = [];

  data.forEach((row, index) => {
    const rowIdx = index + 1;
    
    // Normalização rigorosa dos campos de texto para evitar duplicatas por espaços ou caixa alta/baixa
    const motorista = String(row['MOTORISTAS'] || '').trim().toUpperCase();
    const tipoDesvio = String(row['TIPO DE DESVIO'] || '').trim().toUpperCase();
    const qtdRaw = row['QTD'];
    const qtd = typeof qtdRaw === 'number' ? qtdRaw : parseInt(String(qtdRaw || '0').replace(/\D/g, '')) || 0;
    let dataRaw = row['DATA'];
    
    // Basic Validation
    if (!motorista) errors.push({ row: rowIdx, field: 'MOTORISTAS', message: 'Campo obrigatório' });
    if (!tipoDesvio) errors.push({ row: rowIdx, field: 'TIPO DE DESVIO', message: 'Campo obrigatório' });

    // Date Processing
    let dateObj: Date | null = null;
    if (typeof dataRaw === 'number') {
      dateObj = XLSX.SSF.parse_date_code(dataRaw) ? new Date((dataRaw - 25569) * 86400 * 1000) : null;
    } else if (dataRaw) {
      dateObj = new Date(dataRaw);
    }

    // Se não tiver data, tentamos pegar do campo MÊS ou apenas marcar como inválido para edição
    const isValid = motorista && tipoDesvio && dateObj && !isNaN(dateObj.getTime());
    
    if (dateObj && !isNaN(dateObj.getTime())) {
      const ano = dateObj.getFullYear();
      const mesNum = dateObj.getMonth() + 1;
      
      const d = new Date(dateObj);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const semana = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

      const mesNome = Object.keys(MONTH_MAP)[mesNum - 1];

      cleaned.push({
        id: crypto.randomUUID(),
        MOTORISTAS: motorista,
        "TIPO DE DESVIO": tipoDesvio,
        QTD: qtd,
        "MÊS": String(row['MÊS'] || mesNome).toUpperCase().trim(),
        TRATADO: String(row['TRATADO'] || 'NÃO').toUpperCase().trim(),
        TRATATIVA: String(row['TRATATIVA'] || '').trim(),
        DATA: dateObj.toISOString().split('T')[0],
        STATUS: String(row['STATUS'] || '').trim(),
        "APLICADO POR": String(row['APLICADO POR'] || '').trim(),
        ANO: ano,
        MES_NUM: mesNum,
        SEMANA: semana,
        isValid: true
      });
    } else {
       cleaned.push({
        id: crypto.randomUUID(),
        MOTORISTAS: motorista,
        "TIPO DE DESVIO": tipoDesvio,
        QTD: qtd,
        "MÊS": String(row['MÊS'] || '').toUpperCase().trim(),
        TRATADO: String(row['TRATADO'] || 'NÃO').toUpperCase().trim(),
        TRATATIVA: String(row['TRATATIVA'] || '').trim(),
        DATA: String(dataRaw || ''),
        STATUS: String(row['STATUS'] || '').trim(),
        "APLICADO POR": String(row['APLICADO POR'] || '').trim(),
        isValid: false
      });
    }
  });

  return { cleaned, errors };
};

export const exportToExcel = (originalData: DeviationRecord[], treatedData: DeviationRecord[]) => {
  const wb = XLSX.utils.book_new();
  const reorderColumns = (rec: DeviationRecord) => ({
    "MOTORISTAS": rec.MOTORISTAS,
    "TIPO DE DESVIO": rec["TIPO DE DESVIO"],
    "QTD": rec.QTD,
    "MÊS": rec["MÊS"],
    "TRATADO": rec.TRATADO,
    "TRATATIVA": rec.TRATATIVA,
    "DATA": rec.DATA,
    "STATUS": rec.STATUS,
    "APLICADO POR": rec["APLICADO POR"],
    "ANO": rec.ANO,
    "MES_NUM": rec.MES_NUM,
    "SEMANA": rec.SEMANA
  });

  const ws1 = XLSX.utils.json_to_sheet(originalData.map(reorderColumns));
  XLSX.utils.book_append_sheet(wb, ws1, "BASE_ATUAL");
  const ws2 = XLSX.utils.json_to_sheet(treatedData.filter(r => r.isValid).map(reorderColumns));
  XLSX.utils.book_append_sheet(wb, ws2, "BASE_TRATADA");
  XLSX.writeFile(wb, "gestao_desvios_atualizada.xlsx");
};
