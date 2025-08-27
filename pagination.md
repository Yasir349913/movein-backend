// examples/pagination-usage.js - Professional Pagination Examples

import { 
  createPagination, 
  quickPaginate, 
  cursorPaginate, 
  smartPaginate,
  paginationMiddleware 
} from '../utils/pagination.utils.js';
import { User, Post, Order } from '../models/index.js';

/**
 * EXAMPLE 1: Basic Offset Pagination (Good for small datasets, UI with page numbers)
 */
export const getUsersWithOffsetPagination = async (req, res) => {
  try {
    // Simple approach using quickPaginate
    const result = await quickPaginate(User, 
      { isActive: true }, // filter
      {
        page: req.query.page || 1,
        limit: req.query.limit || 20,
        sort: 'createdAt',
        order: 'desc',
        select: 'name email role createdAt',
        populate: [{ path: 'profile', select: 'avatar bio' }]
      }
    );

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      // Returns: currentPage, totalPages, totalItems, hasNextPage, etc.
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * EXAMPLE 2: High-Performance Cursor Pagination (Best for large datasets)
 */
export const getPostsWithCursorPagination = async (req, res) => {
  try {
    const { cursor, limit = 10 } = req.query;
    
    const result = await cursorPaginate(Post, 
      { published: true }, // filter
      {
        cursor, // e.g., "507f191e810c19729de860ea" from previous response
        limit,
        cursorField: '_id', // Field to use for cursor
        direction: 'next', // 'next' or 'prev'
        sort: 'createdAt',
        order: 'desc',
        select: 'title content author createdAt',
        populate: [{ path: 'author', select: 'name avatar' }]
      }
    );

    return res.json({
      success: true,
      posts: result.data,
      pagination: {
        hasNextPage: result.pagination.hasNextPage,
        nextCursor: result.pagination.nextCursor,
        // Use nextCursor in next request: /api/posts?cursor=nextCursor
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * EXAMPLE 3: Advanced Pagination Builder Pattern
 */
export const getOrdersAdvanced = async (req, res) => {
  try {
    const { 
      page, 
      cursor, 
      status, 
      userId, 
      startDate, 
      endDate,
      minAmount,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build complex filter
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (minAmount) filter.amount = { $gte: parseFloat(minAmount) };

    // Use builder pattern for full control
    const result = await createPagination(Order, filter)
      .paginate(page, 20) // offset pagination if page provided
      .cursor(cursor, '_id', 'next') // cursor pagination if cursor provided
      .sort(sort, order)
      .select('amount status items createdAt userId')
      .populate([
        { path: 'userId', select: 'name email' },
        { path: 'items.productId', select: 'name price' }
      ])
      .configure({
        lean: true,
        maxLimit: 50,
        estimateTotal: true, // Faster counting for large collections
        includeMeta: true // Include query metadata
      })
      .execute(); // Auto-chooses best pagination method

    return res.json({
      success: true,
      orders: result.data,
      pagination: result.pagination,
      meta: result.meta, // Includes query info, execution time, etc.
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * EXAMPLE 4: Smart Pagination with Auto-Selection
 */
export const getSmartPaginatedData = async (req, res) => {
  try {
    // smartPaginate automatically chooses between offset and cursor based on dataset size
    const result = await smartPaginate(User, 
      { role: { $in: ['user', 'moderator'] } },
      {
        page: req.query.page, // If provided, prefers offset pagination
        cursor: req.query.cursor, // If provided, uses cursor pagination
        limit: 25,
        sort: 'lastActive',
        order: 'desc',
        select: 'name email role lastActive',
        estimateTotal: true
      }
    );

    return res.json({
      success: true,
      users: result.data,
      pagination: result.pagination,
      // Automatically returns appropriate pagination metadata
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * EXAMPLE 5: Using Pagination Middleware
 */

// In your routes file:
// router.get('/posts', paginationMiddleware, getPostsWithMiddleware);

export const getPostsWithMiddleware = async (req, res) => {
  try {
    // req.pagination is automatically populated by middleware
    const { page, limit, cursor, sort, order, select, populate } = req.pagination;
    
    const result = await createPagination(Post, { published: true })
      .paginate(page, limit)
      .cursor(cursor)
      .sort(sort || 'createdAt', order || 'desc')
      .select(select)
      .populate(populate || [])
      .execute();

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * EXAMPLE 6: Real-time Feed with Cursor Pagination
 */
export const getFeed = async (req, res) => {
  try {
    const { cursor, direction = 'next' } = req.query;
    
    // Perfect for infinite scroll or real-time feeds
    const result = await cursorPaginate(Post, 
      { 
        published: true,
        $or: [
          { visibility: 'public' },
          { authorId: req.user.id }
        ]
      },
      {
        cursor,
        direction, // 'next' for newer posts, 'prev' for older
        limit: 15,
        cursorField: 'createdAt', // Using timestamp for chronological order
        sort: 'createdAt',
        order: 'desc',
        select: 'title content images authorId createdAt likes comments',
        populate: [
          { path: 'authorId', select: 'name avatar verified' },
          { path: 'comments', select: 'content authorId createdAt', limit: 3 }
        ]
      }
    );

    return res.json({
      success: true,
      feed: result.data,
      pagination: {
        hasMore: result.pagination.hasNextPage,
        nextCursor: result.pagination.nextCursor,
        prevCursor: result.pagination.prevCursor,
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * EXAMPLE 7: Paginated Search with Performance Optimization
 */
export const searchContent = async (req, res) => {
  try {
    const { query, category, cursor, limit = 20 } = req.query;
    
    // Build search filter
    const searchFilter = {};
    if (query) {
      searchFilter.$text = { $search: query };
    }
    if (category) {
      searchFilter.category = category;
    }

    // Use cursor pagination for better search performance
    const result = await cursorPaginate(Post, searchFilter, {
      cursor,
      limit,
      sort: query ? { score: { $meta: 'textScore' } } : 'createdAt', // Relevance sort if searching
      order: 'desc',
      select: query ? 'title content category score' : 'title content category createdAt',
      lean: true
    });

    return res.json({
      success: true,
      results: result.data,
      pagination: result.pagination,
      searchQuery: query,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Frontend Integration Examples
 */

// React Hook Example for Offset Pagination
export const useOffsetPagination = (url, options = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchPage = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${url}?page=${page}&limit=${options.limit || 20}`);
      const result = await response.json();
      
      setData(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Pagination error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { data, pagination, loading, fetchPage };
};

// React Hook Example for Cursor Pagination (Infinite Scroll)
export const useCursorPagination = (url, options = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);

  const loadMore = async (cursor = null) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (cursor) queryParams.set('cursor', cursor);
      if (options.limit) queryParams.set('limit', options.limit);

      const response = await fetch(`${url}?${queryParams}`);
      const result = await response.json();
      
      // Append new data for infinite scroll
      setData(prev => cursor ? [...prev, ...result.data] : result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Pagination error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { data, pagination, loading, loadMore };
};