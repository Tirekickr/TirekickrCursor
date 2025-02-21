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
  isTable: boolean;
}

interface ExtractedData {
  text: string;
  structuredData: {
    tables: string[][];
    keyValuePairs: { [key: string]: string };
    amounts: string[];
    dates: string[];
  };
  blocks: TextBlock[];
}

export function PDFProcessor({ file }: { file: File }) {
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findDates = (text: string): string[] => {
    const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi;
    return text.match(dateRegex) || [];
  };

  const findAmounts = (text: string): string[] => {
    const amountRegex = /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|dollars)\b/gi;
    return text.match(amountRegex) || [];
  };

  const detectTables = (blocks: TextBlock[]): string[][] => {
    // Group blocks by Y position (same line)
    const lines = new Map<number, TextBlock[]>();
    
    blocks.forEach(block => {
      const roundedY = Math.round(block.y / 10) * 10; // Round to nearest 10 to group nearby Y positions
      if (!lines.has(roundedY)) {
        lines.set(roundedY, []);
      }
      lines.get(roundedY)!.push(block);
    });

    // Sort blocks in each line by X position
    lines.forEach(lineBlocks => {
      lineBlocks.sort((a, b) => a.x - b.x);
    });

    // Convert to array of text arrays
    return Array.from(lines.values())
      .sort((a, b) => a[0].y - b[0].y) // Sort lines by Y position
      .map(lineBlocks => lineBlocks.map(block => block.text));
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
              height: item.height || 0,
              isTable: false
            });
          }
        });
      }

      const tables = detectTables(blocks);

      setExtractedData({
        text: fullText,
        structuredData: {
          tables: tables,
          keyValuePairs: {},
          amounts: findAmounts(fullText),
          dates: findDates(fullText)
        },
        blocks: blocks
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
          {/* Tables */}
          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-2">Detected Tables</h4>
            {extractedData.structuredData.tables.map((row, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-1">
                {row.map((cell, j) => (
                  <div key={j} className="p-1 border text-sm">
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Amounts and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold mb-2">Amounts Found</h4>
              <ul className="list-disc pl-4">
                {extractedData.structuredData.amounts.map((amount, i) => (
                  <li key={i}>{amount}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold mb-2">Dates Found</h4>
              <ul className="list-disc pl-4">
                {extractedData.structuredData.dates.map((date, i) => (
                  <li key={i}>{date}</li>
                ))}
              </ul>
            </div>
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