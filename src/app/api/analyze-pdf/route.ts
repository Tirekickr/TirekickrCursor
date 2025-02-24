import { google } from 'googleapis';

const sheets = google.sheets('v4');

const insertIntoGoogleSheets = async (spreadsheetId: string, range: string, values: any[][]) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'path/to/your/service-account-file.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();

  await sheets.spreadsheets.values.update({
    auth: client,
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });
};

const processWithOpenAI = async (text: string) => {
    const response = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: `Translate and organize the following data: ${text}`,
        max_tokens: 1000,
      }),
    });
  
    if (!response.ok) {
      throw new Error("Failed to process with OpenAI");
    }
  
    const data = await response.json();
    return data.choices[0].text;
  }; 