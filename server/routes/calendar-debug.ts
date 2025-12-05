import logger from '@server/logger';
import { Router } from 'express';

const calendarRoutes = Router();

logger.info('Calendar debug routes module loaded');

calendarRoutes.get('/', async (req, res) => {
  logger.info('Calendar debug route hit');
  res.json({
    message: 'Calendar debug route working',
    query: req.query,
    timestamp: new Date().toISOString(),
  });
});

calendarRoutes.get('/count', async (req, res) => {
  logger.info('Calendar debug count route hit');
  res.json({
    message: 'Calendar debug count route working',
    timestamp: new Date().toISOString(),
  });
});

logger.info('Calendar debug routes configured');

export default calendarRoutes;
