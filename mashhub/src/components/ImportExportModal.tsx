import { useState, useRef } from 'react';
import { X, Upload, FileText, FileSpreadsheet } from 'lucide-react';
import { FileService } from '../services/fileService';
import type { Song } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (songs: Song[]) => Promise<void>;
  songs: Song[];
}

export function ImportExportModal({ isOpen, onClose, onImport, songs }: ImportExportModalProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'csv' | 'xlsx'>('csv');
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      let importedSongs: Song[];
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        importedSongs = await FileService.importFromCSV(file);
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        importedSongs = await FileService.importFromXLSX(file);
      } else {
        throw new Error('Unsupported file format. Please select a CSV or XLSX file.');
      }

      if (importedSongs.length === 0) {
        throw new Error('No valid songs found in the file.');
      }

      // Import in batches of 100 for better performance
      const BATCH_SIZE = 100;
      const totalBatches = Math.ceil(importedSongs.length / BATCH_SIZE);
      let successCount = 0;
      const errors: string[] = [];

      setImportProgress({ current: 0, total: importedSongs.length });

      for (let i = 0; i < totalBatches; i++) {
        const batch = importedSongs.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        
        try {
          await onImport(batch);
          successCount += batch.length;
          setImportProgress({ current: (i + 1) * BATCH_SIZE, total: importedSongs.length });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Batch import failed';
          errors.push(`Batch ${i + 1}: ${errorMsg}`);
          // Continue with next batch
        }

        // Yield to browser to prevent blocking
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      setImportProgress(null);
      setImportResult({ success: successCount, errors });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setImportResult({ 
        success: 0, 
        errors: [error instanceof Error ? error.message : 'Import failed'] 
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await FileService.exportToCSV(songs);
      FileService.downloadFile(blob, `mashup-songs-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleExportXLSX = async () => {
    try {
      const blob = await FileService.exportToXLSX(songs);
      FileService.downloadFile(blob, `mashup-songs-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Import / Export Songs</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Import Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import Songs</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File Format
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={importMode === 'csv'}
                      onChange={(e) => setImportMode(e.target.value as 'csv')}
                      className="mr-2"
                    />
                    <FileText size={16} className="mr-1" />
                    CSV
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="xlsx"
                      checked={importMode === 'xlsx'}
                      onChange={(e) => setImportMode(e.target.value as 'xlsx')}
                      className="mr-2"
                    />
                    <FileSpreadsheet size={16} className="mr-1" />
                    Excel (XLSX)
                  </label>
                </div>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={importMode === 'csv' ? '.csv' : '.xlsx,.xls'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Upload size={16} />
                  <span>{isImporting ? 'Importing...' : 'Choose File'}</span>
                </button>
              </div>

              {importProgress && (
                <div className="p-3 rounded-md bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Importing... {importProgress.current} / {importProgress.total}
                    </span>
                    <span className="text-sm text-blue-700">
                      {Math.round((importProgress.current / importProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {importResult && !importProgress && (
                <div className={`p-3 rounded-md ${
                  importResult.success > 0 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  <p className="font-medium">
                    {importResult.success > 0 
                      ? `Successfully imported ${importResult.success} songs`
                      : 'Import failed'
                    }
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 text-sm list-disc list-inside">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Export Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Songs</h3>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Export all {songs.length} songs to a file
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleExportCSV}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <FileText size={16} />
                  <span>Export CSV</span>
                </button>
                
                <button
                  onClick={handleExportXLSX}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <FileSpreadsheet size={16} />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sample CSV Format */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Expected CSV Format</h4>
            <p className="text-xs text-gray-600 mb-2">
              Your CSV should have these columns (case-insensitive):
            </p>
            <code className="text-xs bg-white p-2 rounded border block">
              ID,TITLE,BPM,KEY,PART,ARTIST,TYPE,ORIGIN,YEAR,SEASON
            </code>
            <p className="text-xs text-gray-500 mt-2">
              Note: Multiple BPMs/Keys can be separated with | (e.g., "120|240" or "C Major|A Minor")
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}