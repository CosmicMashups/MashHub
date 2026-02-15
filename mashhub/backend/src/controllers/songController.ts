import { Request, Response } from 'express';
import { SongService } from '../services/songService';

const songService = new SongService();

export class SongController {
  async getAllSongs(req: Request, res: Response) {
    try {
      const songs = await songService.getAllSongs();
      res.json(songs);
    } catch (error) {
      console.error('Error fetching songs:', error);
      res.status(500).json({ error: 'Failed to fetch songs' });
    }
  }

  async getSongById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const song = await songService.getSongById(id);
      
      if (!song) {
        return res.status(404).json({ error: 'Song not found' });
      }
      
      res.json(song);
    } catch (error) {
      console.error('Error fetching song:', error);
      res.status(500).json({ error: 'Failed to fetch song' });
    }
  }

  async createSong(req: Request, res: Response) {
    try {
      const song = await songService.createSong(req.body);
      res.status(201).json(song);
    } catch (error) {
      console.error('Error creating song:', error);
      res.status(500).json({ error: 'Failed to create song' });
    }
  }

  async updateSong(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const song = await songService.updateSong(id, req.body);
      res.json(song);
    } catch (error) {
      console.error('Error updating song:', error);
      res.status(500).json({ error: 'Failed to update song' });
    }
  }

  async deleteSong(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await songService.deleteSong(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting song:', error);
      res.status(500).json({ error: 'Failed to delete song' });
    }
  }
}
