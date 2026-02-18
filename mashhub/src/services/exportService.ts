import ExcelJS from 'exceljs';
import type { Song, SongSection, Project } from '../types';
import { sectionService } from './database';

/**
 * Sanitize a CSV cell value to prevent CSV injection.
 * Cells starting with =, +, -, @ are prefixed with a tab to neutralise formula injection
 * when the file is opened in spreadsheet apps (Excel, LibreOffice Calc).
 * The tab character is stripped when users paste the value elsewhere.
 */
function sanitizeCSVCell(value: string): string {
  if (value && /^[=+\-@]/.test(value)) {
    return `\t${value}`;
  }
  return value;
}

/**
 * Quote a string field for CSV output with injection prevention.
 */
function csvField(value: string): string {
  const sanitized = sanitizeCSVCell(value);
  return `"${sanitized.replace(/"/g, '""')}"`;
}

export class ExportService {
  // Export songs to CSV with enhanced formatting (two-file format)
  static async exportSongsToCSV(songs: Song[], filename?: string): Promise<void> {
    // Load sections for all songs
    const allSections: SongSection[] = [];
    for (const song of songs) {
      const sections = await sectionService.getBySongId(song.id);
      allSections.push(...sections);
    }
    
    // Export songs.csv (with CSV injection prevention via csvField())
    const songsHeaders = ['ID', 'TITLE', 'ARTIST', 'TYPE', 'ORIGIN', 'SEASON', 'YEAR', 'NOTES'];
    const songsContent = [
      songsHeaders.join(','),
      ...songs.map((song) => [
        song.id,
        csvField(song.title),
        csvField(song.artist),
        csvField(song.type),
        csvField(song.origin),
        csvField(song.season),
        song.year,
        csvField(song.notes || ''),
      ].join(','))
    ].join('\n');
    
    // Export song_sections.csv
    const sectionsHeaders = ['SECTION_ID', 'SONG_ID', 'PART', 'BPM', 'KEY', 'SECTION_ORDER'];
    const sectionsContent = [
      sectionsHeaders.join(','),
      ...allSections.map((section) => [
        section.sectionId,
        section.songId,
        csvField(section.part),
        section.bpm,
        csvField(section.key),
        section.sectionOrder,
      ].join(','))
    ].join('\n');
    
    // Download both files
    const songsBlob = new Blob([songsContent], { type: 'text/csv;charset=utf-8;' });
    const sectionsBlob = new Blob([sectionsContent], { type: 'text/csv;charset=utf-8;' });
    
    this.downloadFile(songsBlob, filename ? `songs-${filename}` : `songs-${this.getDateString()}.csv`);
    // Small delay to allow first download to complete
    setTimeout(() => {
      this.downloadFile(sectionsBlob, filename ? `song_sections-${filename}` : `song_sections-${this.getDateString()}.csv`);
    }, 100);
  }

  // Export songs to XLSX with enhanced formatting (includes sections sheet)
  static async exportSongsToXLSX(songs: Song[], filename?: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // Songs sheet
    const songsSheet = workbook.addWorksheet('Songs');
    songsSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'TITLE', key: 'title', width: 35 },
      { header: 'ARTIST', key: 'artist', width: 30 },
      { header: 'TYPE', key: 'type', width: 15 },
      { header: 'ORIGIN', key: 'origin', width: 15 },
      { header: 'YEAR', key: 'year', width: 10 },
      { header: 'SEASON', key: 'season', width: 10 },
      { header: 'NOTES', key: 'notes', width: 30 }
    ];
    
    // Add data with conditional formatting
    songs.forEach((song, index) => {
      const row = songsSheet.addRow({
        id: song.id,
        title: song.title,
        artist: song.artist,
        type: song.type,
        origin: song.origin,
        year: song.year,
        season: song.season,
        notes: song.notes || ''
      });
      
      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
      }
    });
    
    // Sections sheet
    const sectionsSheet = workbook.addWorksheet('Sections');
    sectionsSheet.columns = [
      { header: 'SECTION_ID', key: 'sectionId', width: 15 },
      { header: 'SONG_ID', key: 'songId', width: 10 },
      { header: 'PART', key: 'part', width: 15 },
      { header: 'BPM', key: 'bpm', width: 10 },
      { header: 'KEY', key: 'key', width: 20 },
      { header: 'SECTION_ORDER', key: 'sectionOrder', width: 15 }
    ];
    
    // Load and add all sections
    const allSections: SongSection[] = [];
    for (const song of songs) {
      const sections = await sectionService.getBySongId(song.id);
      allSections.push(...sections);
    }
    
    allSections.forEach((section, index) => {
      sectionsSheet.addRow({
        sectionId: section.sectionId,
        songId: section.songId,
        part: section.part,
        bpm: section.bpm,
        key: section.key,
        sectionOrder: section.sectionOrder
      });
      
      // Alternate row colors
      if (index % 2 === 0) {
        const row = sectionsSheet.getRow(index + 2);
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
      }
    });
    
    // Style header rows
    [songsSheet, sectionsSheet].forEach(sheet => {
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Add borders
      sheet.eachRow((row) => {
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
      sheet.autoFilter = {
        from: 'A1',
        to: { row: 1, column: sheet.columnCount }
      };
      
      // Freeze header row
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
    });
    
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
      { header: 'TYPE', key: 'type', width: 15 }
    ];
    
    // Add songs grouped by section
    for (const [sectionName, songs] of Object.entries(project.sections)) {
      for (let index = 0; index < songs.length; index++) {
        const song = songs[index];
        // Get sections for this song to find primary BPM/Key
        const sections = await sectionService.getBySongId(song.id);
        const primarySection = sections.find(s => s.sectionOrder === 1) || sections[0];
        
        songsSheet.addRow({
          section: sectionName,
          order: index + 1,
          title: song.title,
          artist: song.artist,
          bpm: primarySection?.bpm || '',
          key: primarySection?.key || '',
          type: song.type
        });
      }
    }
    
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

  // Export to JSON with nested sections
  static async exportToJSON(songs: Song[], filename?: string): Promise<void> {
    // Load sections for all songs and create nested structure
    const songsWithSections = await Promise.all(songs.map(async (song) => {
      const sections = await sectionService.getBySongId(song.id);
      return {
        ...song,
        sections: sections.sort((a, b) => a.sectionOrder - b.sectionOrder)
      };
    }));
    
    const jsonString = JSON.stringify(songsWithSections, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    this.downloadFile(blob, filename || `mashup-data-${this.getDateString()}.json`);
  }

  // Export a project (including its section grouping) to JSON
  static exportProjectToJSON(
    project: Project & { sections: { [key: string]: Song[] } },
    filename?: string
  ): void {
    const jsonContent = JSON.stringify(
      project,
      (_key, value) => (value instanceof Date ? value.toISOString() : value),
      2
    );

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const safeName = project.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'project';
    this.downloadFile(blob, filename || `${safeName}-${this.getDateString()}.json`);
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