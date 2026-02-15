import { Router } from 'express';
import { SongController } from '../controllers/songController';

const router = Router();
const controller = new SongController();

router.get('/', controller.getAllSongs.bind(controller));
router.get('/:id', controller.getSongById.bind(controller));
router.post('/', controller.createSong.bind(controller));
router.put('/:id', controller.updateSong.bind(controller));
router.delete('/:id', controller.deleteSong.bind(controller));

export default router;
