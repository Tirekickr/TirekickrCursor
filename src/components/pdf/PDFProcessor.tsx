'use client';

import { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.entry';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

// Set worker
pdfjs.GlobalWorkerOptions.workerSrc = worker;

interface TextBlock {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface ExtractedData {
  metadata: {
    companyName: string;
    documentType: string;
    period: string;
  };
  tables: TableData[];
  blocks: TextBlock[];
}

export function PDFProcessor({ file }: { file: File }) {
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractMetadata = (blocks: TextBlock[]): ExtractedData['metadata'] => {
    let companyName = 'Unknown Company';
    let documentType = 'Unknown Document Type';
    let period = 'Unknown Period';

    blocks.slice(0, 5).forEach(block => {
      const text = block.text.trim();
      if (text.includes('Profit and Loss')) {
        documentType = 'Profit and Loss';
      } else if (text.match(/January|February|March|April|May|June|July|August|September|October|November|December/)) {
        period = text;
      } else if (!companyName || companyName === 'Unknown Company') {
        companyName = text;
      }
    });

    return {
      companyName,
      documentType,
      period,
    };
  };

  const detectTables = (blocks: TextBlock[]): TableData[] => {
    // Sort blocks by Y position
    const sortedBlocks = [...blocks].sort((a, b) => a.y - b.y);
    
    // Group blocks into rows based on Y position
    const rows: TextBlock[][] = [];
    let currentRow: TextBlock[] = [];
    let currentY = sortedBlocks[0]?.y;

    sortedBlocks.forEach(block => {
      if (Math.abs(block.y - currentY) < 5) {
        currentRow.push(block);
      } else {
        if (currentRow.length > 0) {
          rows.push([...currentRow].sort((a, b) => a.x - b.x));
        }
        currentRow = [block];
        currentY = block.y;
      }
    });
    
    if (currentRow.length > 0) {
      rows.push([...currentRow].sort((a, b) => a.x - b.x));
    }

    // Determine column boundaries based on X positions
    const columnBoundaries = [100, 300, 500]; // Example boundaries, adjust as needed

    // Identify potential tables
    const tables: TableData[] = [];
    let currentTable: string[][] = [];
    let headers: string[] = ['Line Item', 'Period 1', 'Period 2'];

    rows.forEach((row, index) => {
      const rowTexts = ['', '', '']; // Initialize with empty strings for each column

      row.forEach(block => {
        if (block.x < columnBoundaries[1]) {
          rowTexts[0] += block.text + ' '; // First column
        } else if (block.x < columnBoundaries[2]) {
          rowTexts[1] += block.text + ' '; // Second column
        } else {
          rowTexts[2] += block.text + ' '; // Third column
        }
      });

      currentTable.push(rowTexts.map(text => text.trim()));
    });

    if (currentTable.length > 0) {
      tables.push({
        headers: headers,
        rows: currentTable
      });
    }

    return tables;
  };

  const extractText = async () => {
    try {
      setProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const blocks: TextBlock[] = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        textContent.items.forEach((item: TextItem) => {
          if ('str' in item && 'transform' in item) {
            fullText += item.str + '\n';
            blocks.push({
              text: item.str,
              x: item.transform[4],
              y: item.transform[5],
              width: item.width || 0,
              height: item.height || 0
            });
          }
        });
      }

      const metadata = extractMetadata(blocks);
      const tables = detectTables(blocks);

      setExtractedData({
        metadata,
        tables,
        blocks
      });

    } catch (err) {
      console.error('PDF processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract PDF data');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{file.name}</h3>
        <button
          onClick={extractText}
          disabled={processing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {processing ? 'Processing...' : 'Extract Data'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {extractedData && (
        <div className="mt-4 space-y-4">
          {/* Metadata */}
          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-2">Document Metadata</h4>
            <p><strong>Company Name:</strong> {extractedData.metadata.companyName}</p>
            <p><strong>Document Type:</strong> {extractedData.metadata.documentType}</p>
            <p><strong>Period:</strong> {extractedData.metadata.period}</p>
          </div>

          {/* Tables */}
          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-2">Detected Tables</h4>
            {extractedData.tables.map((table, tableIndex) => (
              <div key={tableIndex} className="mb-6">
                <h5 className="font-medium mb-2">Table {tableIndex + 1}</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {table.headers.map((header, i) => (
                          <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {table.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Raw Text */}
          <div className="p-4 bg-gray-50 rounded overflow-auto max-h-96">
            <h4 className="font-semibold mb-2">Raw Text with Positions</h4>
            {extractedData.blocks.map((block, i) => (
              <div key={i} className="mb-2 text-sm">
                <span className="font-mono">
                  ({Math.round(block.x)}, {Math.round(block.y)})
                </span>
                : {block.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 