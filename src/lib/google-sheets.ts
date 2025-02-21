import { google } from 'googleapis';

export async function createGoogleSheet(data: any[][], title: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Create new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: title,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    if (spreadsheetId) {
      // Update the values
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: data,
        },
      });

      return {
        success: true,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        id: spreadsheetId,
      };
    }

    throw new Error('Failed to create spreadsheet');

  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw error;
  }
} 