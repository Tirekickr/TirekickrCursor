import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';

// Set worker source for version 4.x
GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js';

export async function processPDF(file: File) {
  try {
    console.log('Starting PDF processing');
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = getDocument(arrayBuffer);
    const pdf: PDFDocumentProxy = await loadingTask.promise;
    console.log('PDF loaded, pages:', pdf.numPages);
    
    const tables: any[][] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log('Processing page:', pageNum);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const tableData = extractTableFromText(textContent);
      if (tableData.length > 0) {
        tables.push(tableData);
      }
    }
    
    return {
      success: true,
      tables: tables
    };
  } catch (error) {
    console.error('Error in processPDF:', error);
    return {
      success: false,
      error: error.message || 'Failed to process PDF'
    };
  }
}

function extractTableFromText(textContent: any) {
  const rows = new Map<number, any[]>();
  
  textContent.items.forEach((item: any) => {
    const y = Math.round(item.transform[5]); // y-coordinate
    if (!rows.has(y)) {
      rows.set(y, []);
    }
    rows.get(y)!.push({
      text: item.str,
      x: item.transform[4] // x-coordinate
    });
  });
  
  const sortedRows = Array.from(rows.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([_, items]) => 
      items
        .sort((a, b) => a.x - b.x)
        .map(item => item.text)
    );
  
  return sortedRows;
} 