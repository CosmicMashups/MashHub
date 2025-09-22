import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { Song } from '../types';

interface SongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (song: Omit<Song, 'id'>) => Promise<void>;
  onUpdate?: (song: Song) => Promise<void>;
  song?: Song | null; // If provided, we're editing
  title?: string;
}

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
    part: '',
    type: '',
    origin: '',
    year: new Date().getFullYear(),
    season: 'Spring',
    vocalStatus: 'Vocal' as 'Vocal' | 'Instrumental' | 'Both' | 'Pending',
    bpms: [''],
    keys: ['']
  });

  const [primaryBpm, setPrimaryBpm] = useState(0);
  const [primaryKey, setPrimaryKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when song changes
  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title,
        artist: song.artist,
        part: song.part,
        type: song.type,
        origin: song.origin,
        year: song.year,
        season: song.season,
        vocalStatus: song.vocalStatus,
        bpms: song.bpms.length > 0 ? song.bpms.map(String) : [''],
        keys: song.keys.length > 0 ? song.keys : ['']
      });
      
      // Find primary BPM and key indices
      const primaryBpmIndex = song.primaryBpm ? song.bpms.indexOf(song.primaryBpm) : 0;
      const primaryKeyIndex = song.primaryKey ? song.keys.indexOf(song.primaryKey) : 0;
      
      setPrimaryBpm(Math.max(0, primaryBpmIndex));
      setPrimaryKey(Math.max(0, primaryKeyIndex));
    } else {
      // Reset form for new song
      setFormData({
        title: '',
        artist: '',
        part: '',
        type: '',
        origin: '',
        year: new Date().getFullYear(),
        season: 'Spring',
        vocalStatus: 'Vocal' as 'Vocal' | 'Instrumental' | 'Both' | 'Pending',
        bpms: [''],
        keys: ['']
      });
      setPrimaryBpm(0);
      setPrimaryKey(0);
    }
    setErrors({});
  }, [song, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.artist.trim()) {
      newErrors.artist = 'Artist is required';
    }

    const validBpms = formData.bpms
      .map(bpm => parseFloat(bpm))
      .filter(bpm => !isNaN(bpm) && bpm > 0);

    if (validBpms.length === 0) {
      newErrors.bpms = 'At least one valid BPM is required';
    }

    const validKeys = formData.keys.filter(key => key.trim() !== '');
    if (validKeys.length === 0) {
      newErrors.keys = 'At least one key is required';
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
      const validBpms = formData.bpms
        .map(bpm => parseFloat(bpm))
        .filter(bpm => !isNaN(bpm) && bpm > 0);
      
      const validKeys = formData.keys.filter(key => key.trim() !== '');

      const songData: Omit<Song, 'id'> = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        part: formData.part,
        type: formData.type,
        origin: formData.origin.trim(),
        year: formData.year,
        season: formData.season,
        vocalStatus: formData.vocalStatus,
        bpms: validBpms,
        keys: validKeys,
        primaryBpm: validBpms[primaryBpm] || validBpms[0],
        primaryKey: validKeys[primaryKey] || validKeys[0]
      };

      if (isEditing && song) {
        await onUpdate?.({ ...song, ...songData });
      } else {
        await onSave(songData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving song:', error);
      setErrors({ general: 'Failed to save song. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBpmChange = (index: number, value: string) => {
    const newBpms = [...formData.bpms];
    newBpms[index] = value;
    setFormData({ ...formData, bpms: newBpms });
    
    // Clear BPM errors when user starts typing
    if (errors.bpms) {
      setErrors({ ...errors, bpms: '' });
    }
  };

  const handleKeyChange = (index: number, value: string) => {
    const newKeys = [...formData.keys];
    newKeys[index] = value;
    setFormData({ ...formData, keys: newKeys });
    
    // Clear key errors when user starts typing
    if (errors.keys) {
      setErrors({ ...errors, keys: '' });
    }
  };

  const addBpm = () => {
    setFormData({ ...formData, bpms: [...formData.bpms, ''] });
  };

  const addKey = () => {
    setFormData({ ...formData, keys: [...formData.keys, ''] });
  };

  const removeBpm = (index: number) => {
    if (formData.bpms.length > 1) {
      const newBpms = formData.bpms.filter((_, i) => i !== index);
      setFormData({ ...formData, bpms: newBpms });
      if (primaryBpm >= index) {
        setPrimaryBpm(Math.max(0, primaryBpm - 1));
      }
    }
  };

  const removeKey = (index: number) => {
    if (formData.keys.length > 1) {
      const newKeys = formData.keys.filter((_, i) => i !== index);
      setFormData({ ...formData, keys: newKeys });
      if (primaryKey >= index) {
        setPrimaryKey(Math.max(0, primaryKey - 1));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSaving}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
              <AlertCircle size={16} className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{errors.general}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter song title"
                disabled={isSaving}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artist *
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.artist ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter artist name"
                disabled={isSaving}
              />
              {errors.artist && (
                <p className="mt-1 text-sm text-red-600">{errors.artist}</p>
              )}
            </div>
          </div>

          {/* BPM Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BPM (Beats Per Minute) *
            </label>
            <div className="space-y-2">
              {formData.bpms.map((bpm, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => handleBpmChange(index, e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.bpms ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter BPM"
                    disabled={isSaving}
                    min="1"
                    max="300"
                  />
                  <button
                    type="button"
                    onClick={() => setPrimaryBpm(index)}
                    disabled={isSaving}
                    className={`px-3 py-2 text-sm rounded-md ${
                      primaryBpm === index
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Primary
                  </button>
                  {formData.bpms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBpm(index)}
                      disabled={isSaving}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addBpm}
                disabled={isSaving}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-800"
              >
                <Plus size={16} />
                <span>Add BPM</span>
              </button>
            </div>
            {errors.bpms && (
              <p className="mt-1 text-sm text-red-600">{errors.bpms}</p>
            )}
          </div>

          {/* Key Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Musical Key *
            </label>
            <div className="space-y-2">
              {formData.keys.map((key, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={key}
                    onChange={(e) => handleKeyChange(index, e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.keys ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSaving}
                  >
                    <option value="">Select key</option>
                    <option value="C Major">C Major</option>
                    <option value="C# Major">C# Major</option>
                    <option value="D Major">D Major</option>
                    <option value="D# Major">D# Major</option>
                    <option value="E Major">E Major</option>
                    <option value="F Major">F Major</option>
                    <option value="F# Major">F# Major</option>
                    <option value="G Major">G Major</option>
                    <option value="G# Major">G# Major</option>
                    <option value="A Major">A Major</option>
                    <option value="A# Major">A# Major</option>
                    <option value="B Major">B Major</option>
                    <option value="C Minor">C Minor</option>
                    <option value="C# Minor">C# Minor</option>
                    <option value="D Minor">D Minor</option>
                    <option value="D# Minor">D# Minor</option>
                    <option value="E Minor">E Minor</option>
                    <option value="F Minor">F Minor</option>
                    <option value="F# Minor">F# Minor</option>
                    <option value="G Minor">G Minor</option>
                    <option value="G# Minor">G# Minor</option>
                    <option value="A Minor">A Minor</option>
                    <option value="A# Minor">A# Minor</option>
                    <option value="B Minor">B Minor</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setPrimaryKey(index)}
                    disabled={isSaving}
                    className={`px-3 py-2 text-sm rounded-md ${
                      primaryKey === index
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Primary
                  </button>
                  {formData.keys.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKey(index)}
                      disabled={isSaving}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addKey}
                disabled={isSaving}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-800"
              >
                <Plus size={16} />
                <span>Add Key</span>
              </button>
            </div>
            {errors.keys && (
              <p className="mt-1 text-sm text-red-600">{errors.keys}</p>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part
              </label>
              <select
                value={formData.part}
                onChange={(e) => setFormData({ ...formData, part: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isSaving}
              >
                <option value="">Select part</option>
                <option value="Intro">Intro</option>
                <option value="Verse">Verse</option>
                <option value="Chorus">Chorus</option>
                <option value="Bridge">Bridge</option>
                <option value="Outro">Outro</option>
                <option value="Drop">Drop</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origin
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Japan, USA"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.year ? 'border-red-300' : 'border-gray-300'
                }`}
                min="1900"
                max="2030"
                disabled={isSaving}
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">{errors.year}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Season
              </label>
              <select
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isSaving}
              >
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
                <option value="Winter">Winter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vocal Status
              </label>
              <select
                value={formData.vocalStatus}
                onChange={(e) => setFormData({ ...formData, vocalStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isSaving}
              >
                <option value="Vocal">Vocal</option>
                <option value="Instrumental">Instrumental</option>
                <option value="Both">Both</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : (isEditing ? 'Update Song' : 'Save Song')}
          </button>
        </div>
      </div>
    </div>
  );
}