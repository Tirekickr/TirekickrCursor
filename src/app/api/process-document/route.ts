import { NextResponse } from 'next/server';
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from "@aws-sdk/client-textract";
import { google } from 'googleapis';

// Initialize AWS Textract
const textract = new TextractClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Use Textract to analyze the document
    const command = new AnalyzeDocumentCommand({
      Document: {
        Bytes: buffer,
      },
      FeatureTypes: ['TABLES'], // Focus on table extraction
    });

    const response = await textract.send(command);

    // Process tables from Textract response
    const tables = extractTablesFromResponse(response);

    // Create Google Sheet
    const spreadsheet = await createGoogleSheet(tables);

    return NextResponse.json({
      message: 'Document processed successfully',
      spreadsheetUrl: spreadsheet.spreadsheetUrl,
    });

  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Error processing document' },
      { status: 500 }
    );
  }
}

function extractTablesFromResponse(response: any) {
  // Process Textract response to extract tables
  // This will need to be implemented based on your specific needs
  return [];
}

async function createGoogleSheet(tables: any[]) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Create new spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `Financial Document ${new Date().toISOString()}`,
      },
    },
  });

  // Add data to spreadsheet
  if (spreadsheet.data.spreadsheetId) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheet.data.spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: tables.map((table, index) => ({
          range: `Sheet1!A${index * 10 + 1}`,
          values: table,
        })),
      },
    });
  }

  return {
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheet.data.spreadsheetId}`,
  };
} 