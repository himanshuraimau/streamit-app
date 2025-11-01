import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit } from 'lucide-react';
import { useState } from 'react';

interface StreamInfoCardProps {
  title: string;
  onSave: (newTitle: string) => Promise<void>;
}

export function StreamInfoCard({ title, onSave }: StreamInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const handleSave = async () => {
    await onSave(editedTitle);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(title);
    setIsEditing(false);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Stream Information</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-zinc-300">Title</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="title"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              disabled={!isEditing}
              className="flex-1 bg-zinc-800 border-zinc-700 text-white disabled:opacity-70"
              placeholder="Enter stream title..."
            />
            {isEditing ? (
              <>
                <Button 
                  onClick={handleSave}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Save
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCancel}
                  className="border-zinc-700"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-zinc-700"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
