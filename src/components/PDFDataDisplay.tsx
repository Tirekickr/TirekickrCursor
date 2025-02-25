import React from 'react';

interface PDFData {
  documentName: string;
  dateRange: string;
  totalIncome: string;
  grossProfit: string;
  expenses: string;
}

const PDFDataDisplay: React.FC<PDFData> = ({ documentName, dateRange, totalIncome, grossProfit, expenses }) => {
  return (
    <div className="pdf-data-display">
      <h2>{documentName}</h2>
      <p><strong>Date Range:</strong> {dateRange}</p>
      <p><strong>Total Income:</strong> {totalIncome}</p>
      <p><strong>Gross Profit:</strong> {grossProfit}</p>
      <p><strong>Expenses:</strong> {expenses}</p>
    </div>
  );
};

export default PDFDataDisplay; 