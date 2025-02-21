import PDFUploader from '@/components/pdf/PDFUploader';

export default function PDFPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">PDF Processor</h1>
      <PDFUploader />
    </div>
  );
} 