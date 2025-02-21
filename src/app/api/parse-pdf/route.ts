import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import pdf from 'pdf-parse';

export async function POST(req: Request) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { 
        status: 401 
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file provided');
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      });
    }

    console.log('Processing file:', file.name, 'size:', file.size);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse PDF
    const data = await pdf(buffer);
    
    return NextResponse.json({ 
      success: true,
      text: data.text,
      pageCount: data.numpages
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Server error processing request',
      stack: error instanceof Error ? error.stack : undefined
    }, { 
      status: 500 
    });
  }
} 