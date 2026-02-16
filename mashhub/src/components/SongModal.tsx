import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Plus, Trash2, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import type { Song, SongSection } from '../types';
import { sectionService } from '../services/database';
import { useSpotifyData } from '../hooks/useSpotifyData';
import { AlbumArtwork } from './AlbumArtwork';
import { PreviewPlayer } from './PreviewPlayer';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Sheet, SheetContent } from './ui/Sheet';

interface SongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (song: Omit<Song, 'id'>) => Promise<Song>;
  onUpdate?: (song: Song) => Promise<Song>;
  song?: Song | null; // If provided, we're editing
  title?: string;
}

interface SectionFormData {
  id?: string; // Unique ID for stable keys
  part: string;
  bpm: string;
  key: string;
}

const MAJOR_KEYS = [
  'C Major', 'C# Major', 'D Major', 'D# Major', 'E Major', 'F Major',
  'F# Major', 'G Major', 'G# Major', 'A Major', 'A# Major', 'B Major'
];

const COMMON_PARTS = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro', 'Prechorus'];

export function SongModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onUpdate, 
  song, 
  title = "Add New Song" 
}: SongModalProps) {
  const isEditing = !!song;
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    type: '',
    origin: '',
    year: new Date().getFullYear(),
    season: 'Spring',
    sections: [] as SectionFormData[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  
  // Load Spotify data for the song
  const { mapping: spotifyMapping } = useSpotifyData(song);

  // Track if form has been initialized to prevent reset on every render
  const [isInitialized, setIsInitialized] = useState(false);
  const songIdRef = useRef<string | null>(null);

  // Initialize form data when song changes or modal opens
  useEffect(() => {
    // Only initialize when modal opens or song ID actually changes
    const currentSongId = song?.id || null;
    const shouldInitialize = isOpen && (
      !isInitialized || 
      (song && currentSongId !== songIdRef.current) ||
      (!song && songIdRef.current !== null)
    );

    if (!shouldInitialize) return;

    const loadSections = async () => {
      if (song && isOpen) {
        setIsLoadingSections(true);
        try {
          const sections = await sectionService.getBySongId(song.id);
          setFormData({
            title: song.title,
            artist: song.artist,
            type: song.type,
            origin: song.origin || '',
            year: song.year,
            season: song.season || 'Spring',
            sections: sections.length > 0 
              ? sections.map((s, idx) => ({
                  id: `section_${song.id}_${idx}`,
                  part: s.part,
                  bpm: String(s.bpm),
                  key: s.key
                }))
              : [{ id: `section_new_${Date.now()}`, part: '', bpm: '', key: '' }]
          });
          songIdRef.current = song.id;
        } catch (error) {
          console.error('Error loading sections:', error);
          setFormData({
            title: song.title,
            artist: song.artist,
            type: song.type,
            origin: song.origin || '',
            year: song.year,
            season: song.season || 'Spring',
            sections: [{ id: `section_new_${Date.now()}`, part: '', bpm: '', key: '' }]
          });
          songIdRef.current = song.id;
        } finally {
          setIsLoadingSections(false);
        }
      } else if (!song && isOpen) {
        // Reset form for new song
        setFormData({
          title: '',
          artist: '',
          type: '',
          origin: '',
          year: new Date().getFullYear(),
          season: 'Spring',
          sections: [{ id: `section_new_${Date.now()}`, part: '', bpm: '', key: '' }]
        });
        songIdRef.current = null;
      }
      setErrors({});
      setIsInitialized(true);
    };

    loadSections();
  }, [song?.id, isOpen, isInitialized]);

  // Reset initialization flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
      songIdRef.current = null;
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.artist.trim()) {
      newErrors.artist = 'Artist is required';
    }

    // Validate sections
    const validSections = formData.sections.filter(s => {
      const bpm = parseFloat(s.bpm);
      return s.part.trim() !== '' && !isNaN(bpm) && bpm > 0 && s.key.trim() !== '';
    });

    if (validSections.length === 0) {
      newErrors.sections = 'At least one valid section (PART, BPM, and Key) is required';
    }

    if (formData.year < 1900 || formData.year > 2030) {
      newErrors.year = 'Year must be between 1900 and 2030';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      // Create song data (without sections)
      const songData: Omit<Song, 'id'> = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        type: formData.type || 'Anime',
        origin: formData.origin.trim() || 'Japan',
        year: formData.year,
        season: formData.season,
        notes: ''
      };

      let savedSong: Song;
      if (isEditing && song) {
        // Update song
        savedSong = { ...song, ...songData };
        const updatedSong = await onUpdate?.(savedSong);
        if (updatedSong) savedSong = updatedSong;
        
        // Delete old sections
        await sectionService.deleteBySongId(savedSong.id);
      } else {
        // Create new song and get the saved song with ID
        savedSong = await onSave(songData);
      }
      
      // Create sections from form data
      const sections: SongSection[] = formData.sections
        .filter(s => {
          const bpm = parseFloat(s.bpm);
          return s.part.trim() !== '' && !isNaN(bpm) && bpm > 0 && s.key.trim() !== '';
        })
        .map((s, index) => ({
          sectionId: `${savedSong.id}_section_${Date.now()}_${index}`,
          songId: savedSong.id,
          part: s.part.trim(),
          bpm: parseFloat(s.bpm),
          key: s.key.trim(),
          sectionOrder: index + 1
        }));
      
      // Save sections
      if (sections.length > 0) {
        await sectionService.bulkAdd(sections);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving song:', error);
      setErrors({ general: 'Failed to save song. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionChange = useCallback((index: number, field: keyof SectionFormData, value: string) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[index] = { ...newSections[index], [field]: value };
      return { ...prev, sections: newSections };
    });
    
    // Clear section errors when user starts typing
    if (errors.sections) {
      setErrors(prev => ({ ...prev, sections: '' }));
    }
  }, [errors.sections]);

  const addSection = useCallback(() => {
    setFormData(prev => ({ 
      ...prev, 
      sections: [...prev.sections, { id: `section_${Date.now()}_${Math.random()}`, part: '', bpm: '', key: '' }] 
    }));
  }, []);

  const removeSection = useCallback((index: number) => {
    setFormData(prev => {
      if (prev.sections.length > 1) {
        const newSections = prev.sections.filter((_, i) => i !== index);
        return { ...prev, sections: newSections };
      }
      return prev;
    });
  }, []);

  const moveSection = useCallback((index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    setFormData(prev => {
      if (direction === 'down' && index === prev.sections.length - 1) return prev;
      const newSections = [...prev.sections];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      return { ...prev, sections: newSections };
    });
  }, []);

  const isMobile = useIsMobile();

  // Content component (shared between mobile and desktop)
  // Memoize ModalContent to prevent recreation on every render
  // MUST be called before early return to follow Rules of Hooks
  const ModalContent = useMemo(() => {
    if (!isOpen) {
      return null;
    }
    return (
    <>
      <div className="flex items-center justify-between p-4 md:p-6 border-b dark:border-gray-700">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors disabled:opacity-50"
          disabled={isSaving}
          aria-label="Close"
        >
          <X size={20} className="md:w-6 md:h-6" />
        </button>
      </div>

        <div className="p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-center">
              <AlertCircle size={16} className="text-red-500 mr-2" />
              <span className="text-red-700 dark:text-red-300 text-sm">{errors.general}</span>
            </div>
          )}

          {/* Spotify Integration - Album Artwork and Preview */}
          {spotifyMapping && (
            <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-shrink-0">
                  <AlbumArtwork
                    imageUrl={spotifyMapping.imageUrlLarge}
                    alt={`${song?.title || formData.title} by ${song?.artist || formData.artist}`}
                    size="large"
                    lazy={false}
                  />
                </div>
                <div className="flex-1 w-full">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview
                  </h3>
                  <PreviewPlayer
                    previewUrl={spotifyMapping.previewUrl}
                    spotifyUrl={spotifyMapping.spotifyExternalUrl}
                    trackName={song?.title || formData.title}
                  />
                  {spotifyMapping.spotifyExternalUrl && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Powered by Spotify</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter song title"
                disabled={isSaving}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Artist *
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 ${
                  errors.artist ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter artist name"
                disabled={isSaving}
              />
              {errors.artist && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.artist}</p>
              )}
            </div>
          </div>

          {/* Song Sections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Song Sections *
              </label>
              <button
                type="button"
                onClick={addSection}
                disabled={isSaving}
                className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                <Plus size={16} />
                <span>Add Section</span>
              </button>
            </div>
            
            {isLoadingSections ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                Loading sections...
              </div>
            ) : (
              <div className="space-y-3">
                {formData.sections.map((section, index) => (
                  <div 
                    key={section.id || `section_${index}`} 
                    className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Section {index + 1}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => moveSection(index, 'up')}
                          disabled={isSaving || index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                          aria-label="Move up"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(index, 'down')}
                          disabled={isSaving || index === formData.sections.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                          aria-label="Move down"
                        >
                          <ArrowDown size={16} />
                        </button>
                        {formData.sections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSection(index)}
                            disabled={isSaving}
                            className="p-1 text-red-600 hover:text-red-800 dark:hover:text-red-400"
                            aria-label="Remove section"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* PART */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          PART *
                        </label>
                        <select
                          value={section.part}
                          onChange={(e) => handleSectionChange(index, 'part', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300"
                          disabled={isSaving}
                        >
                          <option value="">Select PART</option>
                          {COMMON_PARTS.map(part => (
                            <option key={part} value={part}>{part}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* BPM */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          BPM *
                        </label>
                        <input
                          type="number"
                          value={section.bpm}
                          onChange={(e) => handleSectionChange(index, 'bpm', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300"
                          placeholder="Enter BPM"
                          disabled={isSaving}
                          min="1"
                          max="300"
                        />
                      </div>
                      
                      {/* Key */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Key *
                        </label>
                        <select
                          value={section.key}
                          onChange={(e) => handleSectionChange(index, 'key', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300"
                          disabled={isSaving}
                        >
                          <option value="">Select key</option>
                          {MAJOR_KEYS.map(key => (
                            <option key={key} value={key}>{key}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {errors.sections && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.sections}</p>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300"
                disabled={isSaving}
              >
                <option value="">Select type</option>
                <option value="Anime">Anime</option>
                <option value="Game">Game</option>
                <option value="J-Pop">J-Pop</option>
                <option value="K-Pop">K-Pop</option>
                <option value="Electronic">Electronic</option>
                <option value="Rock">Rock</option>
                <option value="Pop">Pop</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Origin
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300"
                placeholder="e.g., Japan, USA"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 ${
                  errors.year ? 'border-red-300' : 'border-gray-300'
                }`}
                min="1900"
                max="2030"
                disabled={isSaving}
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.year}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Season
              </label>
              <select
                value={formData.season}
                onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300"
                disabled={isSaving}
              >
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
                <option value="Winter">Winter</option>
              </select>
            </div>
          </div>
        </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-3 p-4 md:p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={onClose}
          className="btn-secondary w-full sm:w-auto min-h-[44px]"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="btn-primary w-full sm:w-auto min-h-[44px]"
          disabled={isSaving || isLoadingSections}
        >
          {isSaving ? 'Saving...' : (isEditing ? 'Update Song' : 'Save Song')}
        </button>
      </div>
    </>
    );
  }, [isOpen, title, formData, errors, isSaving, isEditing, isLoadingSections, spotifyMapping, song, handleSave, onClose, handleSectionChange, addSection, removeSection, moveSection]);

  // Early return after all hooks are called
  if (!isOpen) return null;

  // Mobile: Use Sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[90vh] p-0 flex flex-col"
          showDragHandle
        >
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
            {ModalContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use centered dialog
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {ModalContent}
      </div>
    </div>
  );
}
