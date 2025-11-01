import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Image } from 'lucide-react';
import { useCreatorApplication } from '@/hooks/useCreatorApplication';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  purpose?: string;
  onUploadComplete?: (fileUrl: string) => void;
  onUploadError?: (error: string) => void;
  currentFile?: File | string | null;
  placeholder?: string;
  className?: string;
}

export function FileUpload({
  accept = 'image/*,.pdf',
  maxSize = 10,
  purpose,
  onUploadComplete,
  onUploadError,
  currentFile,
  placeholder = 'Click to upload or drag and drop',
  className = '',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, loading } = useCreatorApplication();

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      const error = `File size must be less than ${maxSize}MB`;
      onUploadError?.(error);
      return;
    }

    // Validate file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.match(type.replace('*', '.*'));
    });

    if (!isValidType) {
      const error = 'Invalid file type';
      onUploadError?.(error);
      return;
    }

    setUploadedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Upload file
    try {
      const result = await uploadFile(file, purpose);
      onUploadComplete?.(result.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(message);
      setUploadedFile(null);
      setPreview(null);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle click to select file
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Clear file
  const handleClear = () => {
    setUploadedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasFile = uploadedFile || currentFile;
  const isImage = uploadedFile?.type.startsWith('image/') || 
                  (typeof currentFile === 'string' && currentFile.includes('image'));

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragging 
            ? 'border-purple-500 bg-purple-500/10' 
            : 'border-zinc-700 hover:border-zinc-600'
          }
          ${hasFile ? 'bg-zinc-800' : 'bg-zinc-900'}
          ${loading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-lg">
            <div className="flex items-center gap-2 text-white">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Uploading...
            </div>
          </div>
        )}

        {hasFile ? (
          <div className="space-y-3">
            {preview ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden bg-zinc-800">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-32 rounded-lg bg-zinc-800">
                <FileText className="w-12 h-12 text-zinc-600" />
              </div>
            )}
            
            <div className="text-sm text-zinc-300">
              {uploadedFile?.name || 'File uploaded'}
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              {isImage ? (
                <Image className="w-12 h-12 text-zinc-600" />
              ) : (
                <Upload className="w-12 h-12 text-zinc-600" />
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-zinc-300">{placeholder}</p>
              <p className="text-xs text-zinc-500">
                Max size: {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}