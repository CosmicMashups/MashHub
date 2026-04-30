import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

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

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

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
    <>
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className={`px-4 py-2 cursor-pointer flex items-center space-x-3 ${
            index === selectedIndex 
              ? 'bg-primary-50 text-primary-900' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelect(suggestion)}
          onKeyDown={handleKeyDown}
        >
          <Search size={16} className="text-gray-400" />
          <span className="text-sm">{suggestion}</span>
        </div>
      ))}
    </>
  );
}