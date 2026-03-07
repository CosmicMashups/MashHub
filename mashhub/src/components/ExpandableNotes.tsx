import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface ExpandableNotesProps {
  initialValue: string;
  onSave: (value: string) => void;
  placeholder?: string;
}

export function ExpandableNotes({ initialValue, onSave, placeholder = 'Add notes...' }: ExpandableNotesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [isExpanded]);

  const handleSave = () => {
    onSave(value.trim());
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsExpanded(false);
  };

  const isPlaceholder = !value.trim();

  return (
    <div className="text-sm">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cursor-pointer flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            onClick={() => setIsExpanded(true)}
          >
            <ChevronRight size={14} className="flex-shrink-0" />
            <span className={isPlaceholder ? 'italic' : ''}>
              Notes: {value.trim() ? (value.length > 40 ? `${value.slice(0, 40)}...` : value) : placeholder}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
              <ChevronDown size={14} />
              <span>Notes</span>
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
              }}
              placeholder={placeholder}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[60px] max-h-[200px] resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-2 py-1 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
