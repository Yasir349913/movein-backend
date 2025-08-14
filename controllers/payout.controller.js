// controllers/payout.controller.js
import { payoutService } from '../services/index.js';
import { logger, ApiResponse, ApiError } from '../utils/index.js';

/**
 * Get landlord payout summary
 */
export const getPayoutSummary = async (req, res) => {
  const userId = req.user._id;
  
  logger.info('Getting payout summary', { userId });
  
  try {
    const summary = await payoutService.getPayoutSummary(userId);
    
    res.status(200).json(
      new ApiResponse(200, summary, 'Payout summary retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get payout summary', { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Get payout history
 */
export const getPayoutHistory = async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  
  logger.info('Getting payout history', { userId, page, limit });
  
  try {
    const history = await payoutService.getLandlordPayoutHistory(
      userId, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.status(200).json(
      new ApiResponse(200, history, 'Payout history retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get payout history', { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Process pending payouts (admin only)
 */
export const processPendingPayouts = async (req, res) => {
  const userId = req.user._id;
  
  logger.info('Manual payout processing initiated', { userId });
  
  try {
    const result = await payoutService.processPendingPayouts();
    
    res.status(200).json(
      new ApiResponse(200, result, 'Payout processing completed')
    );
  } catch (error) {
    logger.error('Payout processing failed', { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Retry failed payouts (admin only)
 */
export const retryFailedPayouts = async (req, res) => {
  const userId = req.user._id;
  
  logger.info('Manual payout retry initiated', { userId });
  
  try {
    const retriedCount = await payoutService.retryFailedPayouts();
    
    res.status(200).json(
      new ApiResponse(200, { retried_count: retriedCount }, 'Failed payouts retried')
    );
  } catch (error) {
    logger.error('Payout retry failed', { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};