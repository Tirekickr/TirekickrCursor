'use client';

import GoogleSheets from '@/components/google-sheets';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <GoogleSheets />
    </div>
  );
} 