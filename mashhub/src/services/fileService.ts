import ExcelJS from 'exceljs';
import type { Song } from '../types';

export class FileService {
  // Import songs from CSV file
  static async importFromCSV(file: File): Promise<Song[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const songs = this.parseCSV(text);
          resolve(songs);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
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
      vocalStatus: 'Pending', // Default status
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

  // Export songs to CSV
  static async exportToCSV(songs: Song[]): Promise<Blob> {
    const headers = ['ID', 'TITLE', 'BPM', 'KEY', 'PART', 'ARTIST', 'TYPE', 'ORIGIN', 'YEAR', 'SEASON', 'VOCAL_STATUS'];
    
    const csvContent = [
      headers.join(','),
      ...songs.map(song => [
        song.id,
        `"${song.title}"`,
        song.bpms.join('|'),
        song.keys.join('|'),
        `"${song.part}"`,
        `"${song.artist}"`,
        `"${song.type}"`,
        `"${song.origin}"`,
        song.year,
        `"${song.season}"`,
        song.vocalStatus
      ].join(','))
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
      { header: 'SEASON', key: 'season', width: 10 },
      { header: 'VOCAL_STATUS', key: 'vocalStatus', width: 15 }
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
        season: song.season,
        vocalStatus: song.vocalStatus
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