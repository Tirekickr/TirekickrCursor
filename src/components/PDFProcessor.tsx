'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import dynamic from 'next/dynamic';
import { LRUCache } from 'lru-cache';

// Configure cache
const cache = new LRUCache({
  max: 10, // Maximum number of PDFs to cache
  maxSize: 50 * 1024 * 1024, // 50MB total cache size
  sizeCalculation: (value, key) => {
    // Calculate size in bytes for cache entries
    return value instanceof Blob ? value.size : 1;
  },
  ttl: 1000 * 60 * 5, // Cache for 5 minutes
});

// Import PDF viewer dynamically
const PDFViewer = dynamic(() => import('react-pdf').then(mod => mod.Document), {
  ssr: false,
  loading: () => <div>Loading PDF viewer...</div>
});

interface FinancialData {
  date?: string;
  description?: string;
  amount?: string;
  category?: string;
}

export default function PDFProcessor() {
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    try {
      setLoading(true);
      setStatus('Processing PDF...');
      
      const file = acceptedFiles[0];
      console.log('File selected:', file.name, 'size:', file.size);
      
      // Check cache first
      const cachedUrl = cache.get(file.name);
      if (cachedUrl) {
        console.log('Using cached PDF');
        setPdfFile(cachedUrl as string);
        setStatus('PDF loaded from cache');
        setLoading(false);
        return;
      }

      // Create a URL for the PDF and cache it
      const url = URL.createObjectURL(file);
      cache.set(file.name, url);
      setPdfFile(url);
      
      setStatus('PDF loaded successfully');
      
    } catch (error) {
      console.error('Processing error:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Failed to process PDF'}`);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      cache.forEach((url) => {
        if (typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      cache.clear();
    };
  }, []);

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

      {pdfFile && (
        <div className="mt-4 border rounded-lg p-4">
          <PDFViewer
            file={pdfFile}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            className="flex flex-col items-center"
          >
            {Array.from(new Array(numPages), (el, index) => (
              <dynamic.Page 
                key={`page_${index + 1}`} 
                pageNumber={index + 1} 
                className="mb-4"
              />
            ))}
          </PDFViewer>
        </div>
      )}
    </div>
  );
} 