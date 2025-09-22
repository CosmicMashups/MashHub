import { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, FileJson, Music, Folder } from 'lucide-react';
import { ExportService } from '../services/exportService';
import type { Song, Project } from '../types';

interface EnhancedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  projects?: (Project & { sections: { [key: string]: Song[] } })[];
}

export function EnhancedExportModal({ isOpen, onClose, songs, projects = [] }: EnhancedExportModalProps) {
  const [exportType, setExportType] = useState<'songs' | 'project'>('songs');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'json'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportType === 'songs') {
        if (format === 'csv') {
          await ExportService.exportSongsToCSV(songs);
        } else if (format === 'xlsx') {
          await ExportService.exportSongsToXLSX(songs);
        } else if (format === 'json') {
          ExportService.exportToJSON(songs);
        }
      } else if (exportType === 'project' && selectedProject) {
        const project = projects.find(p => p.id === selectedProject);
        if (project) {
          if (format === 'xlsx') {
            await ExportService.exportProjectToXLSX(project);
          } else if (format === 'json') {
            ExportService.exportToJSON(project);
          }
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getExportIcon = () => {
    switch (format) {
      case 'csv':
        return <FileText size={20} className="text-green-600" />;
      case 'xlsx':
        return <FileSpreadsheet size={20} className="text-blue-600" />;
      case 'json':
        return <FileJson size={20} className="text-purple-600" />;
    }
  };

  const getFormatDescription = () => {
    switch (format) {
      case 'csv':
        return 'Comma-separated values, compatible with Excel and Google Sheets';
      case 'xlsx':
        return 'Excel format with formatting, filters, and multiple sheets';
      case 'json':
        return 'JSON format for developers and data analysis';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isExporting}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What would you like to export?
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="songs"
                  checked={exportType === 'songs'}
                  onChange={(e) => setExportType(e.target.value as 'songs')}
                  className="mr-3"
                />
                <div className="flex items-center space-x-3">
                  <Music size={20} className="text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">All Songs</div>
                    <div className="text-sm text-gray-500">{songs.length} songs</div>
                  </div>
                </div>
              </label>
              
              {projects.length > 0 && (
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="project"
                    checked={exportType === 'project'}
                    onChange={(e) => setExportType(e.target.value as 'project')}
                    className="mr-3"
                  />
                  <div className="flex items-center space-x-3">
                    <Folder size={20} className="text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">Project</div>
                      <div className="text-sm text-gray-500">{projects.length} projects available</div>
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Project Selection */}
          {exportType === 'project' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({Object.values(project.sections).flat().length} songs)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['csv', 'xlsx', 'json'] as const).map((fmt) => (
                <label
                  key={fmt}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    format === fmt
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    value={fmt}
                    checked={format === fmt}
                    onChange={(e) => setFormat(e.target.value as 'csv' | 'xlsx' | 'json')}
                    className="mr-3"
                  />
                  <div className="flex items-center space-x-2">
                    {fmt === 'csv' && <FileText size={16} className="text-green-600" />}
                    {fmt === 'xlsx' && <FileSpreadsheet size={16} className="text-blue-600" />}
                    {fmt === 'json' && <FileJson size={16} className="text-purple-600" />}
                    <span className="font-medium text-gray-900 uppercase">{fmt}</span>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">{getFormatDescription()}</p>
          </div>

          {/* Export Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Export Preview</h3>
            <div className="flex items-center space-x-3">
              {getExportIcon()}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {exportType === 'songs' 
                    ? `All Songs (${songs.length} songs)`
                    : selectedProject 
                      ? projects.find(p => p.id === selectedProject)?.name || 'Selected Project'
                      : 'No project selected'
                  }
                </div>
                <div className="text-xs text-gray-500">
                  Format: {format.toUpperCase()} • {getFormatDescription()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || (exportType === 'project' && !selectedProject)}
            className="btn-primary flex items-center space-x-2"
          >
            <Download size={16} />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}