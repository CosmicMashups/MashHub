import prisma from '../config/database';
import type { Prisma } from '@prisma/client';

export class SongService {
  async getAllSongs() {
    return prisma.song.findMany({
      include: {
        sections: {
          orderBy: {
            sectionOrder: 'asc',
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async getSongById(id: string) {
    return prisma.song.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: {
            sectionOrder: 'asc',
          },
        },
      },
    });
  }

  async createSong(
    data: Omit<Prisma.SongCreateInput, 'sections'> & {
      sections?: Prisma.SongSectionCreateWithoutSongInput[];
    }
  ) {
    const { sections, ...songData } = data;
    
    return prisma.song.create({
      data: {
        ...songData,
        sections: sections ? {
          create: sections,
        } : undefined,
      },
      include: {
        sections: true,
      },
    });
  }

  async updateSong(
    id: string,
    data: Omit<Prisma.SongUpdateInput, 'sections'> & { sections?: unknown }
  ) {
    const { sections, ...songData } = data;
    void sections;
    
    return prisma.song.update({
      where: { id },
      data: songData,
      include: {
        sections: true,
      },
    });
  }

  async deleteSong(id: string) {
    return prisma.song.delete({
      where: { id },
    });
  }
}
