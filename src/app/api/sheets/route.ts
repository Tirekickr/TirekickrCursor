import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

// You'll need to set these up in your environment variables
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY!;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL!;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID!;

async function getGoogleSheetClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { tableData } = await req.json();

    if (!tableData || !Array.isArray(tableData)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' });
    }

    const sheets = await getGoogleSheetClient();

    // Write to Google Sheets
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Sheet1!A1', // Adjust range as needed
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: tableData,
      },
    });

    return NextResponse.json({
      success: true,
      updatedRange: response.data.updates?.updatedRange,
    });

  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error processing request',
    }, { status: 500 });
  }
} 