import { SkeletonLoader } from './SkeletonLoader';

interface SkeletonSongListProps {
  rows?: number;
}

export function SkeletonSongList({ rows = 8 }: SkeletonSongListProps) {
  return <SkeletonLoader rows={rows} />;
}
