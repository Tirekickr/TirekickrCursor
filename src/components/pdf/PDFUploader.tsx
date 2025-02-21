'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFProcessor } from './PDFProcessor';

interface PDFFile {
  file: File;
  preview: string;
  name: string;
}

export default function PDFUploader() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    try {
      setProcessing(true);
      setError(null);

      const newFiles = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name
      }));

      setPdfFiles(prev => [...prev, ...newFiles]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
    } finally {
      setProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div 
        {...getRootProps()} 
        className={`p-6 border-2 border-dashed rounded-lg text-center transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {processing ? (
          <p className="text-gray-600">Processing...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-600">Drag & drop PDFs here, or click to select files</p>
            <p className="text-sm text-gray-500">Supported formats: PDF</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {pdfFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Uploaded Files</h3>
          <div className="grid grid-cols-1 gap-4">
            {pdfFiles.map((pdf, index) => (
              <div key={`${pdf.name}-${index}`}>
                <PDFProcessor file={pdf.file} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 