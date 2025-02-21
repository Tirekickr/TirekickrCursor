import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: Request) {
  try {
    const { data } = await req.json();

    // Initialize Google Sheets API (you'll need to set up credentials)
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Financial Data ${new Date().toISOString().split('T')[0]}`,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    // Prepare the data for the sheet
    const values = [
      ['Date', 'Description', 'Amount', 'Category'], // Header row
      ...data.map((item: any) => [item.date, item.description, item.amount, item.category]),
    ];

    // Update the sheet with the data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return NextResponse.json({
      success: true,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    });

  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create spreadsheet',
    }, { status: 500 });
  }
} 