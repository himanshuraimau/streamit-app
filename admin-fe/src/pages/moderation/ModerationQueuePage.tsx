import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModerationActionDialog } from '@/components/moderation/ModerationActionDialog';
import { moderationApi, ContentDetail } from '@/lib/api/moderation.api';
import { Eye, Flag, Image as ImageIcon, Video } from 'lucide-react';

type ContentType = 'all' | 'shorts' | 'posts';

export function ModerationQueuePage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [selectedContent, setSelectedContent] = useState<ContentDetail | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['moderation', 'queue', contentType, page, pageSize, search],
    queryFn: () => {
      const params = {
        page,
        pageSize,
        sortBy: 'flagCount' as const,
        sortOrder: 'desc' as const,
      };

      if (contentType === 'shorts') {
        return moderationApi.getShorts(params);
      } else if (contentType === 'posts') {
        return moderationApi.getPosts(params);
      } else {
        return moderationApi.getQueue(params);
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleViewContent = async (contentId: string) => {
    try {
      const content = await moderationApi.getContentById(contentId);
      setSelectedContent(content);
      setDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch content details:', error);
    }
  };

  const columns: ColumnDef<ContentDetail>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge variant="outline">
            {type === 'short' ? (
              <><Video className="h-3 w-3 mr-1" /> Short</>
            ) : type === 'post' ? (
              <><ImageIcon className="h-3 w-3 mr-1" /> Post</>
            ) : (
              <><Video className="h-3 w-3 mr-1" /> Stream</>
            )}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'content',
      header: 'Preview',
      cell: ({ row }) => {
        const content = row.original.content;
        const hasMedia = row.original.mediaUrls && row.original.mediaUrls.length > 0;
        
        return (
          <div className="max-w-xs">
            {hasMedia && (
              <Badge variant="secondary" className="mb-1">
                <ImageIcon className="h-3 w-3 mr-1" />
                {row.original.mediaUrls!.length} media
              </Badge>
            )}
            {content && (
              <p className="text-sm text-muted-foreground truncate">{content}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'authorName',
      header: 'Author',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.authorName}</p>
          <p className="text-xs text-muted-foreground">@{row.original.authorUsername}</p>
        </div>
      ),
    },
    {
      accessorKey: 'flagCount',
      header: 'Flags',
      cell: ({ row }) => (
        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
          <Flag className="h-3 w-3" />
          {row.original.flagCount}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      accessorKey: 'isHidden',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isHidden ? 'secondary' : 'default'}>
          {row.original.isHidden ? 'Hidden' : 'Visible'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewContent(row.original.id)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <p className="text-muted-foreground">
          Review and moderate flagged content
        </p>
      </div>

      <Tabs value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
        <TabsList>
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="shorts">Shorts</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value={contentType} className="space-y-4">
          <FilterBar
            searchPlaceholder="Search by author or content..."
            filters={[]}
            onSearchChange={setSearch}
            onFilterChange={() => {}}
          />

          <DataTable
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={{
              pageIndex: page - 1,
              pageSize,
            }}
            onPaginationChange={(updater) => {
              const newState = typeof updater === 'function' 
                ? updater({ pageIndex: page - 1, pageSize })
                : updater;
              setPage(newState.pageIndex + 1);
            }}
            pageCount={data?.pagination?.totalPages || 0}
          />
        </TabsContent>
      </Tabs>

      {selectedContent && (
        <ModerationActionDialog
          content={selectedContent}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
