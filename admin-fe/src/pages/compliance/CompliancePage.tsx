import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/common/DataTable';
import { GeoBlockForm } from '@/components/compliance/GeoBlockForm';
import { DataExportButton } from '@/components/compliance/DataExportButton';
import { Badge } from '@/components/ui/badge';
import { complianceApi, type Takedown } from '@/lib/api/compliance.api';
import { queryKeys } from '@/lib/queryKeys';
import { format } from 'date-fns';

export function CompliancePage() {
  const [page, setPage] = useState(1);

  const { data: takedownsData, isLoading: takedownsLoading } = useQuery({
    queryKey: queryKeys.compliance.takedowns({ page }),
    queryFn: () => complianceApi.getTakedowns({ page, pageSize: 20 }),
  });

  const takedownColumns: ColumnDef<Takedown>[] = [
    {
      accessorKey: 'contentType',
      header: 'Content Type',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.contentType.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'authorName',
      header: 'Author',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.authorName}</div>
      ),
    },
    {
      accessorKey: 'hiddenReason',
      header: 'Legal Reason',
      cell: ({ row }) => (
        <div className="max-w-md truncate text-sm">
          {row.original.hiddenReason}
        </div>
      ),
    },
    {
      accessorKey: 'hiddenAt',
      header: 'Removed At',
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.hiddenAt), 'MMM d, yyyy HH:mm')}
        </div>
      ),
    },
    {
      accessorKey: 'hiddenBy',
      header: 'Removed By',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.hiddenBy}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance & Legal</h1>
        <p className="text-muted-foreground">
          Manage legal compliance, geo-blocking, and data exports
        </p>
      </div>

      <Tabs defaultValue="geo-block" className="space-y-4">
        <TabsList>
          <TabsTrigger value="geo-block">Geo-Blocking</TabsTrigger>
          <TabsTrigger value="data-export">Data Export</TabsTrigger>
          <TabsTrigger value="takedowns">Legal Takedowns</TabsTrigger>
        </TabsList>

        <TabsContent value="geo-block" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Content Blocking</CardTitle>
              <CardDescription>
                Block content access from specific regions for legal compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeoBlockForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Data Export</CardTitle>
              <CardDescription>
                Export user data for GDPR and IT Rules compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataExportButton />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="takedowns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Legal Takedowns</CardTitle>
              <CardDescription>
                Content removed for legal reasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={takedownColumns}
                data={takedownsData?.data || []}
                isLoading={takedownsLoading}
                pagination={takedownsData?.pagination}
                onPaginationChange={setPage}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CompliancePage;
