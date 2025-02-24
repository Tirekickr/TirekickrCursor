import { headers } from 'next/headers';

export default async function DashboardPDF() {
  const requestHeaders = await headers(); // ✅ Await headers before use

  console.log("Headers:", requestHeaders);

  return (
    <div>
      <h1>PDF Dashboard</h1>
      {/* Additional content here */}
    </div>
  );
} 