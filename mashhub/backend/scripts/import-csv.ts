import { PrismaClient } from '@prisma/client';
import path from 'path';
import { CSVService } from '../src/services/csvService';

const prisma = new PrismaClient();
const csvService = new CSVService();

async function importCSVData() {
  try {
    console.log('Starting CSV import...');

    // Paths to CSV files (relative to project root)
    const songsPath = path.join(process.cwd(), 'data/songs.csv');
    const sectionsPath = path.join(process.cwd(), 'data/song_sections.csv');

    // Parse CSV files
    console.log('Parsing songs.csv...');
    const songs = await csvService.parseSongsCSV(songsPath);
    console.log(`Found ${songs.length} songs`);

    console.log('Parsing song_sections.csv...');
    const sections = await csvService.parseSongSectionsCSV(sectionsPath);
    console.log(`Found ${sections.length} sections`);

    // Validate sections
    const { valid: validSections, orphans } = csvService.validateSections(songs, sections);
    if (orphans.length > 0) {
      console.warn(`Warning: ${orphans.length} orphan sections found (sections without parent songs)`);
      console.warn('Orphan section IDs:', orphans.map(s => s.sectionId).join(', '));
    }

    // Clear existing data (optional - remove if you want to preserve data)
    console.log('Clearing existing data...');
    await prisma.projectEntry.deleteMany();
    await prisma.project.deleteMany();
    await prisma.songSection.deleteMany();
    await prisma.song.deleteMany();

    // Import songs
    console.log('Importing songs...');
    await prisma.song.createMany({
      data: songs,
      skipDuplicates: true,
    });
    console.log(`Imported ${songs.length} songs`);

    // Import sections
    console.log('Importing song sections...');
    await prisma.songSection.createMany({
      data: validSections,
      skipDuplicates: true,
    });
    console.log(`Imported ${validSections.length} sections`);

    console.log('CSV import completed successfully!');

    // Print summary
    const songCount = await prisma.song.count();
    const sectionCount = await prisma.songSection.count();
    console.log('\nDatabase Summary:');
    console.log(`- Total songs: ${songCount}`);
    console.log(`- Total sections: ${sectionCount}`);
    console.log(`- Average sections per song: ${(sectionCount / songCount).toFixed(2)}`);

  } catch (error) {
    console.error('Error importing CSV data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
importCSVData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
