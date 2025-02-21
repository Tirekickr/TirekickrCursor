'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Only keep the dynamic import
const PDFProcessorClient = dynamic(() => import('./PDFProcessor'), {
  ssr: false,
  loading: () => <div>Loading PDF processor...</div>
});

export default function GooglePicker() {
  const [pickerInited, setPickerInited] = useState(false);

  // Add immediate console log to check environment variables
  console.log('Environment Check:', {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
    actualClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, // This will show the actual value
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? 'Present' : 'Missing'
  });

  // Add this at the very top of your component
  console.log('CHECKING ENV:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  useEffect(() => {
    console.log('Loading APIs...');
    
    // Load both required scripts
    const loadGoogleApis = () => {
      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      
      const script2 = document.createElement('script');
      script2.src = 'https://accounts.google.com/gsi/client';

      script1.onload = () => {
        console.log('API script loaded');
        window.gapi.load('picker', () => {
          console.log('Picker loaded');
          setPickerInited(true);
        });
      };

      document.body.appendChild(script1);
      document.body.appendChild(script2);
    };

    loadGoogleApis();
  }, []);

  const handleClick = async () => {
    console.log('Button clicked with client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      console.error('Client ID is missing!');
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse: any) => {
          if (tokenResponse.access_token) {
            console.log('Got access token');
            createPicker(tokenResponse.access_token);
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Detailed error:', error);
    }
  };

  const createPicker = (token: string) => {
    console.log('Creating picker with token');
    
    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.SPREADSHEETS)
      .setOAuthToken(token)
      .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
      .setCallback((data: any) => {
        if (data.action === 'picked') {
          const doc = data.docs[0];
          console.log('Selected:', doc);
        }
      })
      .build();

    picker.setVisible(true);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        disabled={!pickerInited}
      >
        Select Google Sheet
      </button>
    </div>
  );
} 