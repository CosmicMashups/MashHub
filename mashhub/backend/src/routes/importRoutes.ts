import { Router } from 'express';
import { ImportController } from '../controllers/importController';

const router = Router();
const controller = new ImportController();

router.post('/csv', controller.importCSV.bind(controller));

export default router;
