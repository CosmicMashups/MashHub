import prisma from '../config/database';

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

  async createSong(data: any) {
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

  async updateSong(id: string, data: any) {
    const { sections, ...songData } = data;
    
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
