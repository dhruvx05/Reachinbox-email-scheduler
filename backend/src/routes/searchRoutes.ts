import { Router, Request, Response } from 'express';
import { searchEmailsInElasticsearch } from '../services/elasticsearch';

const router = Router();

// GET /api/emails/search?q=query
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const results = await searchEmailsInElasticsearch(query);

    res.json({
      success: true,
      query,
      count: results.length,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
