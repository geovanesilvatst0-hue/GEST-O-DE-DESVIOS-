
export interface DeviationRecord {
  id: string;
  MOTORISTAS: string;
  "TIPO DE DESVIO": string;
  QTD: number;
  "MÊS": string;
  TRATADO: string;
  TRATATIVA: string;
  DATA: string; // ISO String or YYYY-MM-DD
  STATUS: string;
  "APLICADO POR": string;
  // Treated columns
  ANO?: number;
  MES_NUM?: number;
  SEMANA?: number;
  isValid?: boolean;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export enum MonthName {
  JANEIRO = "JANEIRO",
  FEVEREIRO = "FEVEREIRO",
  MARCO = "MARCO",
  ABRIL = "ABRIL",
  MAIO = "MAIO",
  JUNHO = "JUNHO",
  JULHO = "JULHO",
  AGOSTO = "AGOSTO",
  SETEMBRO = "SETEMBRO",
  OUTUBRO = "OUTUBRO",
  NOVEMBRO = "NOVEMBRO",
  DEZEMBRO = "DEZEMBRO"
}

export const MONTH_MAP: Record<string, number> = {
  "JANEIRO": 1, "FEVEREIRO": 2, "MARCO": 3, "ABRIL": 4, "MAIO": 5, "JUNHO": 6,
  "JULHO": 7, "AGOSTO": 8, "SETEMBRO": 9, "OUTUBRO": 10, "NOVEMBRO": 11, "DEZEMBRO": 12
};
