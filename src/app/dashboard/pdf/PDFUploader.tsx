'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DateRange, FinancialDocument, FinancialDocumentType } from '@/types/financial';
import FinancialTable from './FinancialTable';

interface UploadResponse {
  success: boolean;
  document?: FinancialDocument;
  error?: string;
}

export default function PDFUploader() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [documentType, setDocumentType] = useState<FinancialDocumentType>('PROFIT_AND_LOSS');
  const [dateRange, setDateRange] = useState<DateRange>({
    type: 'MONTHLY',
    startDate: new Date(),
    endDate: new Date()
  });

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload PDF');
      }

      const result = await response.json();
      setUploadResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <label className="block mb-2">Document Type</label>
        <select 
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as FinancialDocumentType)}
          className="w-full p-2 border rounded"
        >
          <option value="PROFIT_AND_LOSS">Profit & Loss</option>
          <option value="BALANCE_SHEET">Balance Sheet</option>
          <option value="CASH_FLOW">Cash Flow</option>
          <option value="AR">Accounts Receivable</option>
          <option value="AP">Accounts Payable</option>
          <option value="INVENTORY">Inventory</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block mb-2">Date Range Type</label>
        <select 
          value={dateRange.type}
          onChange={(e) => setDateRange({ ...dateRange, type: e.target.value as DateRange['type'] })}
          className="w-full p-2 border rounded"
        >
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="ANNUAL">Annual</option>
          <option value="TTM">Trailing Twelve Months</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the PDF here...</p>
        ) : (
          <p>Drag & drop a PDF here, or click to select one</p>
        )}
      </div>

      {isLoading && (
        <div className="mt-4 text-center">
          <p>Processing...</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {uploadResponse && !error && uploadResponse.document && (
        <div className="mt-4">
          <p className="text-lg font-semibold">Successfully processed document</p>
          <FinancialTable document={uploadResponse.document} />
        </div>
      )}
    </div>
  );
}