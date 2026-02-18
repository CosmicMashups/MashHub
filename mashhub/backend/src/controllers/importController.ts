import { Request, Response } from 'express';
import { CSVService } from '../services/csvService';
import prisma from '../config/database';
import path from 'path';

const csvService = new CSVService();

export class ImportController {
  async importCSV(req: Request, res: Response) {
    try {
      // For now, this endpoint expects CSV files to be in the data/ directory
      // Future enhancement: accept file uploads via multipart/form-data
      const songsPath = path.join(process.cwd(), 'data/songs.csv');
      const sectionsPath = path.join(process.cwd(), 'data/song_sections.csv');

      console.log('Parsing songs.csv...');
      const songs = await csvService.parseSongsCSV(songsPath);
      console.log(`Found ${songs.length} songs`);

      console.log('Parsing song_sections.csv...');
      const sections = await csvService.parseSongSectionsCSV(sectionsPath);
      console.log(`Found ${sections.length} sections`);

      // Validate sections
      const { valid: validSections, orphans } = csvService.validateSections(songs, sections);
      if (orphans.length > 0) {
        console.warn(`Warning: ${orphans.length} orphan sections found`);
      }

      // Clear existing data
      await prisma.projectEntry.deleteMany();
      await prisma.project.deleteMany();
      await prisma.songSection.deleteMany();
      await prisma.song.deleteMany();

      // Import songs
      await prisma.song.createMany({
        data: songs,
        skipDuplicates: true,
      });

      // Import sections
      await prisma.songSection.createMany({
        data: validSections,
        skipDuplicates: true,
      });

      // Get summary statistics
      const songCount = await prisma.song.count();
      const sectionCount = await prisma.songSection.count();

      res.json({
        success: true,
        imported: {
          songs: songs.length,
          sections: validSections.length,
        },
        summary: {
          totalSongs: songCount,
          totalSections: sectionCount,
          averageSectionsPerSong: (sectionCount / songCount).toFixed(2),
        },
        warnings: orphans.length > 0 ? {
          orphanSections: orphans.length,
          orphanSectionIds: orphans.map(s => s.sectionId),
        } : undefined,
      });
    } catch (error) {
      console.error('Error importing CSV:', error);
      res.status(500).json({ 
        error: 'Failed to import CSV data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
