import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tag, Eye, TrendingUp } from 'lucide-react';
import type { CategoryResult } from '@/lib/api/search';

interface CategoryResultCardProps {
  category: CategoryResult;
}

export function CategoryResultCard({ category }: CategoryResultCardProps) {
  return (
    <Link to={`/search?q=${encodeURIComponent(category.name)}&type=streams&category=${encodeURIComponent(category.name)}`}>
      <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500/50 transition-all duration-200 p-6 group">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center group-hover:border-purple-500 transition-colors">
            <Tag className="w-6 h-6 text-purple-400" />
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-purple-400 transition-colors truncate">
              {category.name}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>{category.streamCount} {category.streamCount === 1 ? 'stream' : 'streams'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{category.viewerCount.toLocaleString()} viewers</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
