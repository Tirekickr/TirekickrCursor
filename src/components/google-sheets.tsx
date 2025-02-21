'use client';

import { useState } from 'react';
import GooglePicker from './GooglePicker';

export default function GoogleSheets() {
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Google Sheets Integration</h2>
      
      {/* Google Picker */}
      <div className="mt-4">
        <GooglePicker />
      </div>

      {/* Status */}
      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          Processing...
        </div>
      )}
    </div>
  );
} 