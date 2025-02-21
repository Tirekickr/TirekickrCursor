'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from "@clerk/nextjs";

interface FinancialData {
  date?: string;
  description?: string;
  amount?: string;
  category?: string;
}

export default function PDFUploader() {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [parsedText, setParsedText] = useState<string>('');
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);

  const parseFinancialData = (text: string): FinancialData[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const data: FinancialData[] = [];

    lines.forEach(line => {
      const matches = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})|(\$[\d,]+\.\d{2})|([A-Za-z].+)/g);
      
      if (matches && matches.length >= 2) {
        const entry = {
          date: matches.find(m => m.includes('/')) || '',
          description: matches.find(m => !m.includes('/') && !m.includes('$')) || '',
          amount: matches.find(m => m.includes('$')) || '',
          category: 'Uncategorized'
        };
        data.push(entry);
      }
    });

    return data;
  };

  const onDrop = async (acceptedFiles: File[]) => {
    try {
      setLoading(true);
      setStatus('Starting upload...');
      setParsedText('');
      setFinancialData([]);
      
      const file = acceptedFiles[0];
      console.log('File selected:', file.name, 'size:', file.size);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const token = await getToken();
      
      setStatus('Sending to server...');
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setStatus('Processing response...');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process PDF');
      }

      setParsedText(result.text);
      const data = parseFinancialData(result.text);
      setFinancialData(data);
      setStatus('PDF processed successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
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
    <div className="w-full max-w-3xl mx-auto p-4">
      <div 
        {...getRootProps()} 
        className={`p-6 border-2 border-dashed rounded-lg text-center ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <p className="text-gray-600">Processing...</p>
        ) : (
          <p className="text-gray-600">Drag & drop a PDF here, or click to select one</p>
        )}
      </div>

      {status && (
        <div className="mt-4 p-4 border rounded-lg">
          <p>{status}</p>
        </div>
      )}

      {financialData.length > 0 && (
        <div className="mt-4 p-4 border rounded-lg max-h-96 overflow-y-auto">
          <h3 className="font-bold mb-2">Extracted Financial Data:</h3>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Category</th>
              </tr>
            </thead>
            <tbody>
              {financialData.map((item, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{item.date}</td>
                  <td className="border px-4 py-2">{item.description}</td>
                  <td className="border px-4 py-2">{item.amount}</td>
                  <td className="border px-4 py-2">{item.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {parsedText && !financialData.length && (
        <div className="mt-4 p-4 border rounded-lg max-h-96 overflow-y-auto">
          <h3 className="font-bold mb-2">Raw Extracted Text:</h3>
          <pre className="whitespace-pre-wrap text-sm">{parsedText}</pre>
        </div>
      )}
    </div>
  );
} 