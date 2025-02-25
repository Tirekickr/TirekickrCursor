import * as pdfjsLib from 'pdfjs-dist';
import * as path from 'path';

// Configure the worker to use a local path
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
  process.cwd(),
  'node_modules/pdfjs-dist/build/pdf.worker.js'
);

export const pdfLib = pdfjsLib;