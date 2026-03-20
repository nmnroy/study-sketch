import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for v3.x compatibility
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.js',
    import.meta.url
  ).toString();
}

import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

/**
 * Extract text from a file entirely in the browser.
 * Supports: PDF, DOCX, TXT, MD, PNG, JPG, JPEG
 */
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const ext = name.substring(name.lastIndexOf('.'));

  switch (ext) {
    case '.pdf':
      return extractFromPDF(file);
    case '.docx':
      return extractFromDOCX(file);
    case '.txt':
    case '.md':
      return extractFromText(file);
    case '.png':
    case '.jpg':
    case '.jpeg':
      return extractFromImage(file);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

/** PDF → text using pdfjs-dist v3.x */
export async function extractFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ') + '\n';
  }
  return text.trim();
}

/** DOCX → text using mammoth */
async function extractFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/** TXT/MD → text using FileReader */
function extractFromText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

/** Image → text using Tesseract.js OCR */
async function extractFromImage(file: File): Promise<string> {
  const result = await Tesseract.recognize(file, 'eng');
  return result.data.text;
}
