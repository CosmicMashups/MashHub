import ExcelJS from 'exceljs';
import type { Song, Project } from '../types';

export class ExportService {
  // Export songs to CSV with enhanced formatting
  static async exportSongsToCSV(songs: Song[], filename?: string): Promise<void> {
    const headers = [
      'ID', 'TITLE', 'BPM', 'KEY', 'PART', 'ARTIST', 'TYPE', 
      'ORIGIN', 'YEAR', 'SEASON', 'VOCAL_STATUS', 'PRIMARY_BPM', 'PRIMARY_KEY'
    ];
    
    const csvContent = [
      headers.join(','),
      ...songs.map(song => [
        song.id,
        `"${song.title.replace(/"/g, '""')}"`,
        song.bpms.join('|'),
        song.keys.join('|'),
        `"${song.part}"`,
        `"${song.artist.replace(/"/g, '""')}"`,
        `"${song.type}"`,
        `"${song.origin}"`,
        song.year,
        `"${song.season}"`,
        song.vocalStatus,
        song.primaryBpm || song.bpms[0] || '',
        song.primaryKey || song.keys[0] || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename || `mashup-songs-${this.getDateString()}.csv`);
  }

  // Export songs to XLSX with enhanced formatting
  static async exportSongsToXLSX(songs: Song[], filename?: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Songs');
    
    // Define columns with proper formatting
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'TITLE', key: 'title', width: 35 },
      { header: 'BPM', key: 'bpms', width: 20 },
      { header: 'KEY', key: 'keys', width: 25 },
      { header: 'PART', key: 'part', width: 15 },
      { header: 'ARTIST', key: 'artist', width: 30 },
      { header: 'TYPE', key: 'type', width: 15 },
      { header: 'ORIGIN', key: 'origin', width: 15 },
      { header: 'YEAR', key: 'year', width: 10 },
      { header: 'SEASON', key: 'season', width: 10 },
      { header: 'VOCAL_STATUS', key: 'vocalStatus', width: 15 },
      { header: 'PRIMARY_BPM', key: 'primaryBpm', width: 15 },
      { header: 'PRIMARY_KEY', key: 'primaryKey', width: 20 }
    ];
    
    // Add data with conditional formatting
    songs.forEach((song, index) => {
      const row = worksheet.addRow({
        id: song.id,
        title: song.title,
        bpms: song.bpms.join(' | '),
        keys: song.keys.join(' | '),
        part: song.part,
        artist: song.artist,
        type: song.type,
        origin: song.origin,
        year: song.year,
        season: song.season,
        vocalStatus: song.vocalStatus,
        primaryBpm: song.primaryBpm || song.bpms[0] || '',
        primaryKey: song.primaryKey || song.keys[0] || ''
      });
      
      // Add conditional formatting for vocal status
      const vocalStatusCell = row.getCell('vocalStatus');
      switch (song.vocalStatus) {
        case 'Vocal':
          vocalStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
          break;
        case 'Instrumental':
          vocalStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
          break;
        case 'Both':
          vocalStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } };
          break;
        case 'Pending':
          vocalStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8E1' } };
          break;
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
      }
    });
    
    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Add borders
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Add filters
    worksheet.autoFilter = 'A1:M1';
    
    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.downloadFile(blob, filename || `mashup-songs-${this.getDateString()}.xlsx`);
  }

  // Export project to XLSX
  static async exportProjectToXLSX(project: Project & { sections: { [key: string]: Song[] } }, filename?: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // Project info sheet
    const infoSheet = workbook.addWorksheet('Project Info');
    infoSheet.addRow(['Project Name', project.name]);
    infoSheet.addRow(['Created', project.createdAt.toLocaleDateString()]);
    infoSheet.addRow(['Total Songs', Object.values(project.sections).flat().length]);
    infoSheet.addRow(['Sections', Object.keys(project.sections).join(', ')]);
    
    // Songs sheet
    const songsSheet = workbook.addWorksheet('Songs');
    // const allSongs = Object.values(project.sections).flat();
    
    songsSheet.columns = [
      { header: 'SECTION', key: 'section', width: 15 },
      { header: 'ORDER', key: 'order', width: 10 },
      { header: 'TITLE', key: 'title', width: 35 },
      { header: 'ARTIST', key: 'artist', width: 30 },
      { header: 'BPM', key: 'bpm', width: 15 },
      { header: 'KEY', key: 'key', width: 20 },
      { header: 'TYPE', key: 'type', width: 15 },
      { header: 'VOCAL_STATUS', key: 'vocalStatus', width: 15 }
    ];
    
    // Add songs grouped by section
    Object.entries(project.sections).forEach(([sectionName, songs]) => {
      songs.forEach((song, index) => {
        songsSheet.addRow({
          section: sectionName,
          order: index + 1,
          title: song.title,
          artist: song.artist,
          bpm: song.primaryBpm || song.bpms[0] || '',
          key: song.primaryKey || song.keys[0] || '',
          type: song.type,
          vocalStatus: song.vocalStatus
        });
      });
    });
    
    // Style the sheets
    [infoSheet, songsSheet].forEach(sheet => {
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.downloadFile(blob, filename || `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}-${this.getDateString()}.xlsx`);
  }

  // Export to JSON
  static exportToJSON(data: any, filename?: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    this.downloadFile(blob, filename || `mashup-data-${this.getDateString()}.json`);
  }

  // Download file helper
  private static downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Get formatted date string
  private static getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}