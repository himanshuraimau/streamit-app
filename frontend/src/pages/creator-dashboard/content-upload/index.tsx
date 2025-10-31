import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Video, Image, FileText, Folder, Plus, MessageSquare } from 'lucide-react';
import { CreatePostForm } from './_components/CreatePostForm';

export default function ContentUpload() {
  const [activeTab, setActiveTab] = useState<'overview' | 'create-post' | 'file-upload'>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Content Upload</h1>
          <p className="text-zinc-400">Create posts and manage your content</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'create-post' ? 'default' : 'outline'}
            onClick={() => setActiveTab('create-post')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Create Post
          </Button>
          <Button
            variant={activeTab === 'file-upload' ? 'default' : 'outline'}
            onClick={() => setActiveTab('file-upload')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-800">
        <div className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'create-post', label: 'Create Post' },
            { id: 'file-upload', label: 'File Upload' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-600'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'create-post' && (
        <div className="max-w-4xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Create New Post</h2>
            <p className="text-zinc-400">Share your thoughts, images, or videos with your audience</p>
          </div>
          <CreatePostForm onSuccess={() => setActiveTab('overview')} />
        </div>
      )}

      {activeTab === 'file-upload' && (
        <div className="space-y-6">
          {/* File Upload Content */}
          <FileUploadSection />
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview Content */}
          <OverviewSection setActiveTab={setActiveTab} />
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
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      // Check file size (2GB limit)
      if (file.size > 2 * 1024 * 1024 * 1024) {
        errors.push(`${file.name} is too large (max 2GB)`);
        return;
      }

      // Check file type
      const validTypes = [
        'video/mp4', 'video/mov', 'video/avi', 'video/webm',
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
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
    <>
      {/* Hidden file inputs */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.txt,.doc,.docx"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="bg-zinc-900 border-zinc-800 p-6 hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={() => videoInputRef.current?.click()}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Upload Video</h3>
            <p className="text-zinc-400 text-sm">Upload recorded videos and highlights</p>
          </div>
        </Card>

        <Card
          className="bg-zinc-900 border-zinc-800 p-6 hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={() => imageInputRef.current?.click()}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Upload Images</h3>
            <p className="text-zinc-400 text-sm">Thumbnails, banners, and graphics</p>
          </div>
        </Card>

        <Card
          className="bg-zinc-900 border-zinc-800 p-6 hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={() => documentInputRef.current?.click()}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Upload Documents</h3>
            <p className="text-zinc-400 text-sm">Scripts, notes, and other files</p>
          </div>
        </Card>
      </div>

      {/* Drag & Drop Upload Area */}
      <Card
        className={`bg-zinc-900 border-zinc-800 border-dashed border-2 p-12 transition-colors cursor-pointer ${dragOver ? 'border-blue-400 bg-blue-900/20' : ''
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
          <Upload className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Drag & Drop Files Here</h3>
          <p className="text-zinc-400 mb-4">
            Or click to browse and select files from your computer
          </p>
          <Button
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Browse Files
          </Button>
          <div className="mt-4 text-sm text-zinc-500">
            <p>Supported formats: MP4, MOV, AVI, JPG, PNG, GIF, PDF, TXT</p>
            <p>Maximum file size: 2GB</p>
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
                {uploading ? 'Uploading...' : 'Upload Files'}
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
    </>
  );
}

function OverviewSection({ setActiveTab }: { setActiveTab: (tab: 'overview' | 'create-post' | 'file-upload') => void }) {

  return (
    <>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Create Post</h3>
          </div>
          <p className="text-zinc-400 mb-4">Share updates, images, or videos with your community</p>
          <Button
            onClick={() => setActiveTab('create-post')}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            Start Creating
          </Button>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Upload Files</h3>
          </div>
          <p className="text-zinc-400 mb-4">Upload videos, images, and documents to your library</p>
          <Button
            onClick={() => setActiveTab('file-upload')}
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Browse Files
          </Button>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            View All
          </Button>
        </div>

        <div className="space-y-3">
          {[
            { type: 'post', title: 'New community update', time: '2 hours ago', status: 'Published' },
            { type: 'video', title: 'Stream Highlight #1', time: '4 hours ago', status: 'Processing' },
            { type: 'image', title: 'Thumbnail upload', time: '1 day ago', status: 'Complete' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-zinc-800 rounded-lg">
              <div className="w-12 h-12 rounded bg-zinc-700 flex items-center justify-center">
                {item.type === 'post' && <MessageSquare className="w-6 h-6 text-purple-400" />}
                {item.type === 'video' && <Video className="w-6 h-6 text-red-400" />}
                {item.type === 'image' && <Image className="w-6 h-6 text-blue-400" />}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium">{item.title}</h4>
                <p className="text-zinc-400 text-sm">{item.time}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${item.status === 'Published' ? 'text-green-400' :
                    item.status === 'Processing' ? 'text-yellow-400' : 'text-blue-400'
                  }`}>
                  {item.status}
                </span>
                {item.status === 'Processing' && (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Storage Usage */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Folder className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Storage Usage</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Used Storage</span>
            <span className="text-white font-medium">2.4 GB / 10 GB</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full" style={{ width: '24%' }}></div>
          </div>
          <p className="text-zinc-400 text-sm">7.6 GB remaining</p>
        </div>
      </Card>

      {/* Placeholder Content */}
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="text-center">
          <Upload className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Advanced Content Management</h3>
          <p className="text-zinc-400 mb-4">
            Features like batch upload, content scheduling, automatic thumbnails, and video editing tools will be available here.
          </p>
          <p className="text-zinc-500 text-sm">Coming soon...</p>
        </div>
      </Card>
    </>
  );
}