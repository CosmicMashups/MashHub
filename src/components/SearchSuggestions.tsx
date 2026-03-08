import { useState, useEffect, useRef } from 'react';
import { Search, Clock } from 'lucide-react';

interface SearchSuggestionsProps {
  query: string;
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export function SearchSuggestions({ 
  query, 
  suggestions, 
  onSelect, 
  onClose, 
  isVisible 
}: SearchSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isVisible) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          onSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
      onKeyDown={handleKeyDown}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className={`px-4 py-2 cursor-pointer flex items-center space-x-3 ${
            index === selectedIndex 
              ? 'bg-primary-50 text-primary-900' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelect(suggestion)}
        >
          <Search size={16} className="text-gray-400" />
          <span className="text-sm">{suggestion}</span>
        </div>
      ))}
      
      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <Clock size={12} />
            <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}