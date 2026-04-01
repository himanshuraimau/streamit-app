import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RiSearchLine, RiCloseLine } from '@remixicon/react';

export interface FilterConfig {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onSearchChange?: (value: string) => void;
  onFilterChange?: (key: string, value: string | null) => void;
  activeFilters?: Record<string, string>;
}

export function FilterBar({
  searchPlaceholder = 'Search...',
  filters = [],
  onSearchChange,
  onFilterChange,
  activeFilters = {},
}: FilterBarProps) {
  const [searchValue, setSearchValue] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange?.(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, onSearchChange]);

  const handleClearFilter = (key: string) => {
    onFilterChange?.(key, null);
  };

  const handleClearAll = () => {
    setSearchValue('');
    Object.keys(activeFilters).forEach((key) => {
      onFilterChange?.(key, null);
    });
  };

  const activeFilterCount = Object.keys(activeFilters).filter(
    (key) => activeFilters[key]
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
            aria-label={searchPlaceholder}
          />
        </div>

        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={activeFilters[filter.key] || ''}
            onValueChange={(value) => onFilterChange?.(filter.key, value || null)}
          >
            <SelectTrigger 
              className="w-full sm:w-[180px]"
              aria-label={`Filter by ${filter.label}`}
            >
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All {filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="region" aria-label="Active filters">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {Object.entries(activeFilters).map(
            ([key, value]) =>
              value && (
                <Badge key={key} variant="secondary" className="gap-1">
                  {filters.find((f) => f.key === key)?.label}: {value}
                  <button
                    onClick={() => handleClearFilter(key)}
                    className="ml-1 rounded-full hover:bg-muted"
                    aria-label={`Remove ${filters.find((f) => f.key === key)?.label} filter`}
                  >
                    <RiCloseLine className="h-3 w-3" aria-hidden="true" />
                  </button>
                </Badge>
              )
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearAll}
            aria-label="Clear all filters"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
