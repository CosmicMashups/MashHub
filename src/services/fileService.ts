import ExcelJS from 'exceljs';
import type { Song, SongSection } from '../types';
import { parseSongsCSV, parseSongSectionsCSV } from '../data/animeDataLoader';

export interface ImportResult {
  songs: Song[];
  sections: SongSection[];
  errors: string[];
}

export class FileService {
  // Import songs from CSV file(s) - supports both old format and new two-file format
  static async importFromCSV(file: File): Promise<Song[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          // Try to detect format by checking headers
          const firstLine = text.split('\n')[0].toUpperCase();
          
          if (firstLine.includes('SECTION_ID') || firstLine.includes('SONG_ID')) {
            // New format: song_sections.csv
            parseSongSectionsCSV(text);
            // For sections-only import, we need songs too - this is a partial import
            reject(new Error('Please import songs.csv first, then song_sections.csv'));
          } else if (firstLine.includes('ID') && !firstLine.includes('SECTION')) {
            // New format: songs.csv or old format
            if (firstLine.includes('BPM') && firstLine.includes('KEY') && firstLine.includes('PART')) {
              // Old format - convert to new format
              const songs = this.parseCSV(text);
              resolve(songs);
            } else {
              // New format: songs.csv only
              const songs = parseSongsCSV(text);
              resolve(songs);
            }
          } else {
            // Fallback to old parser
            const songs = this.parseCSV(text);
            resolve(songs);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Import songs and sections from two CSV files
  static async importFromTwoCSVFiles(songsFile: File, sectionsFile: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      let songsText = '';
      let sectionsText = '';
      let songsLoaded = false;
      let sectionsLoaded = false;
      const errors: string[] = [];

      const checkComplete = () => {
        if (songsLoaded && sectionsLoaded) {
          try {
            const songs = parseSongsCSV(songsText);
            const sections = parseSongSectionsCSV(sectionsText);
            
            // Validate relationships
            const songIds = new Set(songs.map(s => s.id));
            const orphanSections = sections.filter(s => !songIds.has(s.songId));
            
            if (orphanSections.length > 0) {
              errors.push(`Warning: ${orphanSections.length} sections reference non-existent songs`);
            }
            
            // Filter out orphan sections
            const validSections = sections.filter(s => songIds.has(s.songId));
            
            resolve({ songs, sections: validSections, errors });
          } catch (error) {
            reject(error);
          }
        }
      };

      // Read songs file
      const songsReader = new FileReader();
      songsReader.onload = (e) => {
        songsText = e.target?.result as string;
        songsLoaded = true;
        checkComplete();
      };
      songsReader.onerror = () => {
        errors.push('Failed to read songs.csv');
        songsLoaded = true;
        checkComplete();
      };
      songsReader.readAsText(songsFile);

      // Read sections file
      const sectionsReader = new FileReader();
      sectionsReader.onload = (e) => {
        sectionsText = e.target?.result as string;
        sectionsLoaded = true;
        checkComplete();
      };
      sectionsReader.onerror = () => {
        errors.push('Failed to read song_sections.csv');
        sectionsLoaded = true;
        checkComplete();
      };
      sectionsReader.readAsText(sectionsFile);
    });
  }

  // Import songs from XLSX file
  static async importFromXLSX(file: File): Promise<Song[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          
          const worksheet = workbook.worksheets[0];
          const songs = this.parseWorksheet(worksheet);
          resolve(songs);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Parse CSV text into Song objects
  private static parseCSV(text: string): Song[] {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const songs: Song[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0) continue;
      
      try {
        const song = this.createSongFromRow(headers, values, i);
        if (song) songs.push(song);
      } catch (error) {
        console.warn(`Skipping row ${i + 1}: ${error}`);
      }
    }
    
    return songs;
  }

  // Parse Excel worksheet into Song objects
  private static parseWorksheet(worksheet: ExcelJS.Worksheet): Song[] {
    const songs: Song[] = [];
    const headers: string[] = [];
    
    // Get headers from first row
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.text.trim();
    });
    
    // Process data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const values: string[] = [];
      row.eachCell((cell, colNumber) => {
        values[colNumber - 1] = cell.text.trim();
      });
      
      try {
        const song = this.createSongFromRow(headers, values, rowNumber);
        if (song) songs.push(song);
      } catch (error) {
        console.warn(`Skipping row ${rowNumber}: ${error}`);
      }
    });
    
    return songs;
  }

  // Create Song object from row data
  private static createSongFromRow(headers: string[], values: string[], rowNumber: number): Song | null {
    // Find column indices
    const getColumnIndex = (name: string): number => {
      return headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
    };
    
    const idIndex = getColumnIndex('id');
    const titleIndex = getColumnIndex('title');
    const bpmIndex = getColumnIndex('bpm');
    const keyIndex = getColumnIndex('key');
    const partIndex = getColumnIndex('part');
    const artistIndex = getColumnIndex('artist');
    const typeIndex = getColumnIndex('type');
    const originIndex = getColumnIndex('origin');
    const yearIndex = getColumnIndex('year');
    const seasonIndex = getColumnIndex('season');
    
    // Validate required fields
    if (titleIndex === -1 || !values[titleIndex]?.trim()) {
      throw new Error('Missing title');
    }
    
    if (artistIndex === -1 || !values[artistIndex]?.trim()) {
      throw new Error('Missing artist');
    }
    
    // Parse BPM (support multiple BPMs separated by |)
    const bpmText = bpmIndex !== -1 ? values[bpmIndex] : '';
    const bpms = bpmText ? bpmText.split('|').map(b => parseFloat(b.trim())).filter(b => !isNaN(b)) : [0];
    
    // Parse Key (support multiple keys separated by |)
    const keyText = keyIndex !== -1 ? values[keyIndex] : '';
    const keys = keyText ? keyText.split('|').map(k => k.trim()).filter(k => k) : ['C Major'];
    
    // Generate ID if not provided
    const id = idIndex !== -1 && values[idIndex]?.trim() 
      ? values[idIndex].trim().padStart(5, '0')
      : (rowNumber + 1000).toString().padStart(5, '0');
    
    const song: Song = {
      id,
      title: values[titleIndex].trim(),
      artist: values[artistIndex].trim(),
      part: partIndex !== -1 ? values[partIndex]?.trim() || '' : '',
      type: typeIndex !== -1 ? values[typeIndex]?.trim() || '' : '',
      origin: originIndex !== -1 ? values[originIndex]?.trim() || '' : '',
      year: yearIndex !== -1 ? parseInt(values[yearIndex]) || new Date().getFullYear() : new Date().getFullYear(),
      season: seasonIndex !== -1 ? values[seasonIndex]?.trim() || 'Spring' : 'Spring',
      bpms,
      keys,
      primaryBpm: bpms[0] || 0,
      primaryKey: keys[0] || 'C Major'
    };
    
    return song;
  }

  // Parse CSV line handling quoted values
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // Export songs to CSV (old format for backward compatibility)
  static async exportToCSV(songs: Song[]): Promise<Blob> {
    const headers = ['ID', 'TITLE', 'BPM', 'KEY', 'PART', 'ARTIST', 'TYPE', 'ORIGIN', 'YEAR', 'SEASON'];
    
    const csvContent = [
      headers.join(','),
      ...songs.map(song => [
        song.id,
        `"${song.title}"`,
        song.bpms.join('|'),
        song.keys.join('|'),
        '',
        `"${song.artist}"`,
        `"${song.type}"`,
        `"${song.origin}"`,
        song.year,
        `"${song.season}"`
      ].join(','))
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  // Export songs and sections to two CSV files
  static async exportToTwoCSVFiles(songs: Song[], sections: SongSection[]): Promise<{ songsBlob: Blob; sectionsBlob: Blob }> {
    // Export songs.csv
    const songsHeaders = ['ID', 'TITLE', 'ARTIST', 'TYPE', 'ORIGIN', 'SEASON', 'YEAR', 'NOTES'];
    const songsContent = [
      songsHeaders.join(','),
      ...songs.map(song => [
        song.id,
        `"${song.title.replace(/"/g, '""')}"`,
        `"${song.artist.replace(/"/g, '""')}"`,
        `"${song.type.replace(/"/g, '""')}"`,
        `"${song.origin.replace(/"/g, '""')}"`,
        `"${song.season.replace(/"/g, '""')}"`,
        song.year,
        `"${(song.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    // Export song_sections.csv
    const sectionsHeaders = ['SECTION_ID', 'SONG_ID', 'PART', 'BPM', 'KEY', 'SECTION_ORDER'];
    const sectionsContent = [
      sectionsHeaders.join(','),
      ...sections.map(section => [
        section.sectionId,
        section.songId,
        `"${section.part.replace(/"/g, '""')}"`,
        section.bpm,
        `"${section.key.replace(/"/g, '""')}"`,
        section.sectionOrder
      ].join(','))
    ].join('\n');
    
    return {
      songsBlob: new Blob([songsContent], { type: 'text/csv;charset=utf-8;' }),
      sectionsBlob: new Blob([sectionsContent], { type: 'text/csv;charset=utf-8;' })
    };
  }

  // Export combined/flattened CSV format (one row per section)
  static async exportToCombinedCSV(songs: Song[], sections: SongSection[]): Promise<Blob> {
    const headers = ['ID', 'TITLE', 'ARTIST', 'TYPE', 'ORIGIN', 'SEASON', 'YEAR', 'NOTES', 'PART', 'BPM', 'KEY', 'SECTION_ORDER'];
    
    // Create a map of songs by ID for quick lookup
    const songsMap = new Map(songs.map(s => [s.id, s]));
    
    const csvContent = [
      headers.join(','),
      ...sections.map(section => {
        const song = songsMap.get(section.songId);
        if (!song) return null;
        
        return [
          song.id,
          `"${song.title.replace(/"/g, '""')}"`,
          `"${song.artist.replace(/"/g, '""')}"`,
          `"${song.type.replace(/"/g, '""')}"`,
          `"${song.origin.replace(/"/g, '""')}"`,
          `"${song.season.replace(/"/g, '""')}"`,
          song.year,
          `"${(song.notes || '').replace(/"/g, '""')}"`,
          `"${section.part.replace(/"/g, '""')}"`,
          section.bpm,
          `"${section.key.replace(/"/g, '""')}"`,
          section.sectionOrder
        ].join(',');
      }).filter(row => row !== null)
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  // Export songs to XLSX
  static async exportToXLSX(songs: Song[]): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Songs');
    
    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'TITLE', key: 'title', width: 30 },
      { header: 'BPM', key: 'bpms', width: 15 },
      { header: 'KEY', key: 'keys', width: 20 },
      { header: 'PART', key: 'part', width: 15 },
      { header: 'ARTIST', key: 'artist', width: 25 },
      { header: 'TYPE', key: 'type', width: 15 },
      { header: 'ORIGIN', key: 'origin', width: 15 },
      { header: 'YEAR', key: 'year', width: 10 },
      { header: 'SEASON', key: 'season', width: 10 }
    ];
    
    // Add data
    songs.forEach(song => {
      worksheet.addRow({
        id: song.id,
        title: song.title,
        bpms: song.bpms.join('|'),
        keys: song.keys.join('|'),
        part: song.part,
        artist: song.artist,
        type: song.type,
        origin: song.origin,
        year: song.year,
        season: song.season
      });
    });
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Download file
  static downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}