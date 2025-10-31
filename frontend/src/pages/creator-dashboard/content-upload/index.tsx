import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Video, Image, FileText, Folder, Plus } from 'lucide-react';

export default function ContentUpload() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Content Upload</h1>
          <p className="text-zinc-400">Upload and manage your videos, images, and other content</p>
        </div>
        <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Upload Content
        </Button>
      </div>

      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6 hover:bg-zinc-800 transition-colors cursor-pointer">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Upload Video</h3>
            <p className="text-zinc-400 text-sm">Upload recorded videos and highlights</p>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6 hover:bg-zinc-800 transition-colors cursor-pointer">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Upload Images</h3>
            <p className="text-zinc-400 text-sm">Thumbnails, banners, and graphics</p>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6 hover:bg-zinc-800 transition-colors cursor-pointer">
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
      <Card className="bg-zinc-900 border-zinc-800 border-dashed border-2 p-12">
        <div className="text-center">
          <Upload className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Drag & Drop Files Here</h3>
          <p className="text-zinc-400 mb-4">
            Or click to browse and select files from your computer
          </p>
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            Browse Files
          </Button>
          <div className="mt-4 text-sm text-zinc-500">
            <p>Supported formats: MP4, MOV, AVI, JPG, PNG, GIF, PDF, TXT</p>
            <p>Maximum file size: 2GB</p>
          </div>
        </div>
      </Card>

      {/* Recent Uploads */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Uploads</h3>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            View All
          </Button>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-zinc-800 rounded-lg">
              <div className="w-12 h-12 rounded bg-zinc-700 flex items-center justify-center">
                <Video className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium">Stream Highlight #{i}</h4>
                <p className="text-zinc-400 text-sm">Uploaded 2 hours ago • 45.2 MB</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-sm">Processing</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
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
    </div>
  );
}