import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Video, Image, FileText, MessageSquare, Plus } from 'lucide-react';
import { CreatePostForm } from './_components/CreatePostForm';

export default function ContentUpload() {
  const [activeSection, setActiveSection] = useState<'create-post' | 'file-upload'>('create-post');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Content Upload</h1>
          <p className="text-zinc-400">Create posts and upload files</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={activeSection === 'create-post' ? 'default' : 'outline'}
            onClick={() => setActiveSection('create-post')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Create Post
          </Button>
          <Button
            variant={activeSection === 'file-upload' ? 'default' : 'outline'}
            onClick={() => setActiveSection('file-upload')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>



      {/* Content Sections */}
      {activeSection === 'create-post' && (
        <div className="max-w-4xl mx-auto">
          <CreatePostForm />
        </div>
      )}

      {activeSection === 'file-upload' && (
        <div className="max-w-4xl mx-auto">
          <FileUploadSection />
        </div>
      )}
    </div>
  );
}

function FileUploadSection() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        errors.push(`${file.name} is too large (max 100MB)`);
        return;
      }

      // Check file type
      const validTypes = [
        'video/mp4', 'video/webm', 'video/quicktime',
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain'
      ];

      if (!validTypes.includes(file.type)) {
        errors.push(`${file.name} has unsupported file type`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert('Some files were skipped:\n' + errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      // Here you would implement the actual upload logic using the creator API
      // For now, we'll just simulate an upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Files uploaded:', selectedFiles);

      // Show success message
      alert(`Successfully uploaded ${selectedFiles.length} file(s)!`);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,application/pdf,text/plain"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Main Upload Area */}
      <Card
        className={`bg-zinc-900 border-zinc-800 border-dashed border-2 p-12 transition-colors cursor-pointer ${dragOver ? 'border-blue-400 bg-blue-900/20' : 'hover:border-zinc-600'
          }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center">
          <Upload className="w-20 h-20 text-zinc-600 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-white mb-4">Upload Your Files</h3>
          <p className="text-zinc-400 mb-6 text-lg">
            Drag & drop files here, or click to browse
          </p>
          <Button
            variant="outline"
            size="lg"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Choose Files
          </Button>
          <div className="mt-6 text-sm text-zinc-500">
            <p className="mb-2">Supported formats:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="bg-zinc-800 px-2 py-1 rounded">Images: JPG, PNG, GIF, WebP</span>
              <span className="bg-zinc-800 px-2 py-1 rounded">Videos: MP4, WebM, MOV</span>
              <span className="bg-zinc-800 px-2 py-1 rounded">Documents: PDF, TXT</span>
            </div>
            <p className="mt-2">Maximum file size: 100MB</p>
          </div>
        </div>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Selected Files ({selectedFiles.length})</h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFiles([])}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Clear All
              </Button>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={uploading}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center">
                    {file.type.startsWith('video/') && <Video className="w-5 h-5 text-red-400" />}
                    {file.type.startsWith('image/') && <Image className="w-5 h-5 text-blue-400" />}
                    {!file.type.startsWith('video/') && !file.type.startsWith('image/') && <FileText className="w-5 h-5 text-green-400" />}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{file.name}</p>
                    <p className="text-zinc-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-zinc-400 hover:text-red-400"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}