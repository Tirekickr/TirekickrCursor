export type FinancialDocumentType = 
  | 'PROFIT_AND_LOSS'
  | 'BALANCE_SHEET'
  | 'CASH_FLOW'
  | 'AR'
  | 'AP'
  | 'INVENTORY';

export type DateRange = {
  type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'TTM' | 'CUSTOM';
  startDate: Date;
  endDate: Date;
};

export interface FinancialDocument {
  type: FinancialDocumentType;
  dateRange: DateRange;
  data: {
    headers: string[];
    rows: {
      label: string;
      values: (number | string | null)[];
    }[];
  };
} 