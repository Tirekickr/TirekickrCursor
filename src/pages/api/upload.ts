import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Configure formidable options
const form = formidable({
  uploadDir: path.join(process.cwd(), 'uploads'), // Upload directory
  keepExtensions: true, // Keep file extensions
  maxFileSize: 10 * 1024 * 1024, // 10 MB file size limit
  filename: (name, ext, part, form) => { // Rename each file to avoid duplicate file names
    return `${Date.now()}-${part.originalFilename}`;
  },
});

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Parse the incoming form data
      const files = await new Promise<{ [key: string]: formidable.File }>(
        (resolve, reject) => {
          form.parse(req, (err, fields, files) => {
            if (err) {
              reject(err); // Reject the promise on error
            } else {
              resolve(files); // Resolve the promise with the files
            }
          });
        }
      );

      // Check if a file was uploaded
      if (!files.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Access the uploaded file information
      const uploadedFile = files.file;

      // Error handling to check if the file exists
      if (!fs.existsSync(uploadedFile.filepath)) {
        return res.status(500).json({ error: `File not found at ${uploadedFile.filepath}` });
      }

      // Process the PDF file here. For example, you might want to extract text from it, etc...
      // For this example, we'll just return the file details.
      const responseData = {
        filename: uploadedFile.originalFilename,
        filepath: uploadedFile.filepath,
        fileSize: uploadedFile.size,
      };
      res.status(200).json(responseData);
    } catch (error) {
      console.error('Error during file upload:', error); // Log any server-side errors
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    // Handle non-POST requests
    res.status(405).json({ error: 'Method not allowed' });
  }
} 