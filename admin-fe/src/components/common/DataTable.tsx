import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useState, type ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RiArrowUpSLine, RiArrowDownSLine } from '@remixicon/react';
import { EmptyState } from './EmptyState';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  onPaginationChange?: (page: number) => void;
  toolbar?: ReactNode;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  emptyState?: {
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  pagination,
  onPaginationChange,
  toolbar,
  enableRowSelection = false,
  onRowSelectionChange,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      if (onRowSelectionChange) {
        const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
        const selectedRows = data.filter((_, index) => newSelection[index]);
        onRowSelectionChange(selectedRows);
      }
    },
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection,
    manualPagination: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {toolbar && <div className="mb-4">{toolbar}</div>}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      <Skeleton className="h-4 w-full" />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toolbar && <div className="mb-4">{toolbar}</div>}
      <div className="rounded-md border overflow-x-auto" role="region" aria-label="Data table">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            canSort
                              ? 'flex cursor-pointer select-none items-center gap-2'
                              : ''
                          }
                          onClick={
                            canSort ? header.column.getToggleSortingHandler() : undefined
                          }
                          onKeyDown={
                            canSort
                              ? (e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    header.column.getToggleSortingHandler()?.(e as any);
                                  }
                                }
                              : undefined
                          }
                          role={canSort ? 'button' : undefined}
                          tabIndex={canSort ? 0 : undefined}
                          aria-label={
                            canSort
                              ? `Sort by ${header.column.columnDef.header}${
                                  isSorted === 'asc'
                                    ? ', currently sorted ascending'
                                    : isSorted === 'desc'
                                    ? ', currently sorted descending'
                                    : ''
                                }`
                              : undefined
                          }
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="ml-auto" aria-hidden="true">
                              {isSorted === 'asc' ? (
                                <RiArrowUpSLine className="h-4 w-4" />
                              ) : isSorted === 'desc' ? (
                                <RiArrowDownSLine className="h-4 w-4" />
                              ) : (
                                <RiArrowUpSLine className="h-4 w-4 opacity-30" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24">
                  {emptyState ? (
                    <div className="py-8">
                      <EmptyState
                        title={emptyState.title}
                        description={emptyState.description}
                        action={emptyState.action}
                      />
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No results found.
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <nav 
          className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2" 
          aria-label="Table pagination"
        >
          <div className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] sm:min-h-0"
              onClick={() => onPaginationChange?.(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
              aria-label="Go to previous page"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] sm:min-h-0"
              onClick={() => onPaginationChange?.(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              aria-label="Go to next page"
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
