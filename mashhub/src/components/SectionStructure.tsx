import { Music, Loader2, AlertCircle } from 'lucide-react';
import { useSections } from '../hooks/useSections';

interface SectionStructureProps {
  songId: string;
  className?: string;
}

export function SectionStructure({ songId, className = '' }: SectionStructureProps) {
  const { sections, loading, error } = useSections(songId);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="animate-spin text-music-electric" size={24} />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading sections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <AlertCircle className="text-red-500" size={24} />
        <span className="ml-3 text-red-600 dark:text-red-400">{error}</span>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Music className="mx-auto text-gray-400" size={32} />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No sections defined for this song</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table" aria-label="Song structure">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th 
              scope="col" 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Order
            </th>
            <th 
              scope="col" 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Part
            </th>
            <th 
              scope="col" 
              className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              BPM
            </th>
            <th 
              scope="col" 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Key
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {sections.map((section) => (
            <tr 
              key={section.sectionId}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              role="row"
              aria-label={`Section ${section.sectionOrder}: ${section.part}, ${section.bpm} BPM, ${section.key}`}
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {section.sectionOrder}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                <span className="px-2 py-1 bg-music-cosmic/10 text-music-cosmic rounded-md text-sm font-medium">
                  {section.part}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                <span className="px-3 py-1 bg-music-wave/10 text-music-wave rounded-full text-sm font-bold font-mono">
                  {section.bpm}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                <span className="px-3 py-1 bg-music-cosmic/10 text-music-cosmic rounded-full text-sm font-medium">
                  {section.key}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
