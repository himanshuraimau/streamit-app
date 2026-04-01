import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContentDetail } from '@/lib/api/moderation.api';
import { FileText, Image as ImageIcon, Video } from 'lucide-react';

interface ContentPreviewProps {
  content: ContentDetail;
}

export function ContentPreview({ content }: ContentPreviewProps) {
  const renderMedia = () => {
    if (!content.mediaUrls || content.mediaUrls.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 bg-muted rounded-md">
          <FileText className="h-12 w-12 text-muted-foreground" />
        </div>
      );
    }

    const firstMedia = content.mediaUrls[0];
    const isVideo = content.type === 'short' || firstMedia.match(/\.(mp4|webm|mov)$/i);

    if (isVideo) {
      return (
        <video
          src={firstMedia}
          controls
          className="w-full max-h-96 rounded-md"
          preload="metadata"
        >
          Your browser does not support video playback.
        </video>
      );
    }

    return (
      <img
        src={firstMedia}
        alt="Content preview"
        className="w-full max-h-96 object-contain rounded-md"
      />
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Content Preview</span>
            <Badge variant={content.isHidden ? 'destructive' : 'default'}>
              {content.isHidden ? 'Hidden' : 'Visible'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderMedia()}
          
          {content.content && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm whitespace-pre-wrap">{content.content}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline" className="ml-2">
                {content.type === 'short' ? (
                  <><Video className="h-3 w-3 mr-1" /> Short</>
                ) : content.type === 'post' ? (
                  <><ImageIcon className="h-3 w-3 mr-1" /> Post</>
                ) : (
                  <><Video className="h-3 w-3 mr-1" /> Stream</>
                )}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Author:</span>
              <span className="ml-2 font-medium">{content.authorName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2">{new Date(content.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Flag Count:</span>
              <Badge variant="destructive" className="ml-2">
                {content.flagCount}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {content.flagReasons && content.flagReasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Flag Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {content.flagReasons.map((flag, index) => (
                <div key={index} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <Badge>{flag.reason}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(flag.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reported by: {flag.reporterName}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {content.isHidden && content.hiddenReason && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Removal Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{content.hiddenReason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
