import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, FileType, Image, Loader2 } from 'lucide-react';
import { extractText } from '../services/fileProcessor';

interface FileUploadProps {
  onFileProcessed: (fileName: string, extractedText: string) => void;
  onClear: () => void;
}

interface FileState {
  name: string;
  type: string;
  extractedText: string;
  wordCount: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, onClear }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = '.pdf,.docx,.txt,.md,.png,.jpg,.jpeg';

  const getFileTypeLabel = (name: string): string => {
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    const labels: Record<string, string> = {
      '.pdf': 'PDF Document',
      '.docx': 'Word Document',
      '.txt': 'Text File',
      '.md': 'Markdown File',
      '.png': 'PNG Image (OCR)',
      '.jpg': 'JPEG Image (OCR)',
      '.jpeg': 'JPEG Image (OCR)',
    };
    return labels[ext] || 'Unknown';
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    setError(null);
    setIsExtracting(true);
    setFileState(null);

    try {
      const text = await extractText(file);
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

      setFileState({
        name: file.name,
        type: getFileTypeLabel(file.name),
        extractedText: text,
        wordCount,
      });

      onFileProcessed(file.name, text);
    } catch (err: any) {
      console.error('File extraction error:', err);
      setError(err.message || 'Failed to extract text from file');
    } finally {
      setIsExtracting(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setFileState(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear();
  };

  const isImage = (name: string) => /\.(png|jpe?g)$/i.test(name);

  return (
    <div className="w-full space-y-3">
      {/* Drop Zone */}
      {!fileState && !isExtracting && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`
            relative cursor-pointer group
            flex flex-col items-center justify-center
            w-full h-32 rounded-xl border-2 border-dashed transition-all duration-200
            ${isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={ACCEPTED_TYPES}
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center space-y-2 text-center p-4">
            <div className={`p-3 rounded-full ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'} transition-colors`}>
              <UploadCloud size={24} />
            </div>
            <div className="text-sm">
              <span className="font-medium text-slate-700">Click to upload</span>
              <span className="text-slate-500"> or drag and drop</span>
            </div>
            <p className="text-xs text-slate-400">PDF, DOCX, TXT, MD, PNG, JPG</p>
          </div>
        </div>
      )}

      {/* Extracting State */}
      {isExtracting && (
        <div className="flex flex-col items-center justify-center p-6 bg-indigo-50 border border-indigo-200 rounded-xl">
          <Loader2 size={28} className="animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium text-indigo-700">Extracting text...</p>
          <p className="text-xs text-indigo-500 mt-1">This may take a moment for images (OCR)</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={clearFile}
            className="mt-2 text-xs text-red-500 underline hover:text-red-700"
          >
            Try again
          </button>
        </div>
      )}

      {/* File Info + Preview */}
      {fileState && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* File header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                {isImage(fileState.name) ? <Image size={18} /> : fileState.name.endsWith('.pdf') ? <FileType size={18} /> : <FileText size={18} />}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{fileState.name}</p>
                <p className="text-xs text-slate-500">{fileState.type} · {fileState.wordCount.toLocaleString()} words</p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Text preview */}
          <div className="p-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Extracted Text Preview</p>
            <div className="max-h-[250px] overflow-y-auto bg-slate-50 border border-slate-100 rounded-lg p-3">
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                {fileState.extractedText.substring(0, 2000)}
                {fileState.extractedText.length > 2000 && (
                  <span className="text-slate-400 italic">
                    {'\n\n'}... ({(fileState.extractedText.length - 2000).toLocaleString()} more characters)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
