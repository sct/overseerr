import { getRepository } from '@server/datasource';
import DeclineReason from '@server/entity/DeclineReason';
import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';

const declineReasonsRoutes = Router();

// Get all custom decline reasons
declineReasonsRoutes.get('/', async (_req, res, next) => {
  try {
    const declineReasonRepository = getRepository(DeclineReason);
    const reasons = await declineReasonRepository.find({
      order: { createdAt: 'ASC' },
    });

    return res.status(200).json(reasons);
  } catch (e) {
    logger.error('Something went wrong retrieving decline reasons', {
      label: 'API',
      errorMessage: e.message,
    });
    next({ status: 500, message: 'Unable to retrieve decline reasons.' });
  }
});

// Create a new custom decline reason
declineReasonsRoutes.post<never, DeclineReason, { reason: string }>(
  '/',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        return next({ status: 400, message: 'Reason is required.' });
      }

      const declineReasonRepository = getRepository(DeclineReason);

      // Check if reason already exists
      const existingReason = await declineReasonRepository.findOne({
        where: { reason: reason.trim() },
      });

      if (existingReason) {
        return next({
          status: 409,
          message: 'This decline reason already exists.',
        });
      }

      const newReason = new DeclineReason({
        reason: reason.trim(),
      });

      await declineReasonRepository.save(newReason);

      return res.status(201).json(newReason);
    } catch (e) {
      logger.error('Something went wrong creating decline reason', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 500, message: 'Unable to create decline reason.' });
    }
  }
);

// Delete a custom decline reason
declineReasonsRoutes.delete<{ reasonId: string }>(
  '/:reasonId',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const declineReasonRepository = getRepository(DeclineReason);
      const reasonId = Number(req.params.reasonId);

      const reason = await declineReasonRepository.findOne({
        where: { id: reasonId },
      });

      if (!reason) {
        return next({ status: 404, message: 'Decline reason not found.' });
      }

      await declineReasonRepository.remove(reason);

      return res.status(204).send();
    } catch (e) {
      logger.error('Something went wrong deleting decline reason', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 500, message: 'Unable to delete decline reason.' });
    }
  }
);

export default declineReasonsRoutes;
