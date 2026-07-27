import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { roleGuard } from '../../middleware/roleGuard';
import { indexedEventStore } from './event.indexer';
import { contractListener } from './contract.listener';
import { sendSuccess } from '../../utils/response';

const router = Router();

/** GET /indexer/events?page=1&limit=20&event=AssetRegistered */
router.get('/events', (req: Request, res: Response) => {
  const page = parseInt(String(req.query['page'] || '1'), 10);
  const limit = parseInt(String(req.query['limit'] || '20'), 10);
  const eventName = req.query['event'] ? String(req.query['event']) : undefined;
  const result = indexedEventStore.getAll(page, limit, eventName);
  sendSuccess(res, result);
});

/** GET /indexer/events/:txHash */
router.get('/events/:txHash', (req: Request, res: Response) => {
  const events = indexedEventStore.getByTxHash(String(req.params['txHash']));
  sendSuccess(res, { events, count: events.length });
});

/** POST /indexer/sync — admin trigger manual sync */
router.post('/sync', authenticate, roleGuard('admin'), (_req: Request, res: Response) => {
  contractListener.start();
  sendSuccess(res, { message: 'Blockchain event sync triggered', status: 'running' });
});

export default router;
