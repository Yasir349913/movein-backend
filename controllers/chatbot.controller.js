// controllers/chatbot.controller.js - Simplified with Services
import { ApiResponse } from '../utils/index.js';
import { ChatbotService } from '../services/index.js';
import { ChatbotContent } from '../models/index.js';

/**
 * Initialize the MongoDB Chatbot Framework app instance
 */
export const initChatbot = () => {
  return ChatbotService.initializeChatbot();
};

/**
 * Get conversation history for authenticated user
 */
export const getConversationHistory = async (req, res) => {
  const { userId } = req.user;
  const filters = ChatbotService.buildConversationFilters(req.query);
  const paginationOptions = ChatbotService.buildPaginationOptions(req.query);
  
  const result = await ChatbotService.getConversationHistory(userId, filters, paginationOptions);
  
  res.status(200).json(
    new ApiResponse(200, result, 'Conversation history retrieved successfully')
  );
};

/**
 * Get specific conversation with full message history
 */
export const getConversation = async (req, res) => {
  const { conversationId } = req.params;
  const { userId } = req.user;

  const conversation = await ChatbotService.getConversationById(conversationId, userId);
  
  res.status(200).json(
    new ApiResponse(200, conversation, 'Conversation retrieved successfully')
  );
};

/**
 * Rate a conversation with optional feedback
 */
export const rateConversation = async (req, res) => {
  const { conversationId } = req.params;
  const { userId } = req.user;
  const { score, feedback } = req.body;

  const rating = await ChatbotService.rateConversation(conversationId, userId, score, feedback);
  
  res.status(200).json(
    new ApiResponse(200, rating, 'Conversation rated successfully')
  );
};

/**
 * Soft delete a conversation
 */
export const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;
  const { userId } = req.user;

  await ChatbotService.deleteConversation(conversationId, userId);
  
  res.status(200).json(
    new ApiResponse(200, { deleted: true }, 'Conversation deleted successfully')
  );
};

/**
 * Admin: Create new chatbot content
 */
export const createContent = async (req, res) => {
  const { userId } = req.user;
  const contentData = req.body;

  const content = await ChatbotService.createContent(contentData, userId);
  
  res.status(201).json(
    new ApiResponse(201, content, 'Chatbot content created successfully')
  );
};

/**
 * Admin: Get chatbot content with pagination
 */
export const getContent = async (req, res) => {
  const filters = ChatbotService.buildContentFilters(req.query);
  const paginationOptions = ChatbotService.buildPaginationOptions(req.query);

  const result = await ChatbotService.getContent(filters, paginationOptions);
  
  res.status(200).json(
    new ApiResponse(200, result, 'Chatbot content retrieved successfully')
  );
};

/**
 * Admin: Update chatbot content
 */
export const updateContent = async (req, res) => {
  const { contentId } = req.params;
  const updateData = req.body;

  const content = await ChatbotService.updateContent(contentId, updateData);
  
  res.status(200).json(
    new ApiResponse(200, content, 'Chatbot content updated successfully')
  );
};

/**
 * Admin: Delete chatbot content
 */
export const deleteContent = async (req, res) => {
  const { contentId } = req.params;

  await ChatbotService.deleteContent(contentId);
  
  res.status(200).json(
    new ApiResponse(200, { deleted: true, id: contentId }, 'Chatbot content deleted successfully')
  );
};

/**
 * Admin: Get comprehensive chatbot analytics
 */
export const getAnalytics = async (req, res) => {
  const { startDate, endDate, userType, granularity } = req.query;
  
  const analytics = await ChatbotService.generateAnalytics({ startDate, endDate, userType, granularity });
  
  res.status(200).json(
    new ApiResponse(200, analytics, 'Chatbot analytics retrieved successfully')
  );
};

/**
 * Get chatbot health and status information
 */
export const getHealthStatus = async (req, res) => {
  const health = await ChatbotService.getHealthStatus();
  
  res.status(200).json(
    new ApiResponse(200, health, 'Chatbot health status retrieved successfully')
  );
};



/**
 * Get personalized content for user
 */
export const getPersonalizedContent = async (req, res) => {
  const { userType } = req.user;
  const { query, limit } = req.query;
  
  const content = await ChatbotService.getPersonalizedContent(userType, query, limit);
  
  res.status(200).json(
    new ApiResponse(200, { content }, 'Personalized content retrieved successfully')
  );
};

/**
 * Get suggested prompts based on user type
 */
export const getSuggestedPrompts = async (req, res) => {
  const { userType } = req.user || req.query; // Support both auth and query param
  
  const prompts = ChatbotService.getSuggestedPrompts(userType);
  
  res.status(200).json(
    new ApiResponse(200, { prompts }, 'Suggested prompts retrieved successfully')
  );
};

/**
 * Admin: Seed initial chatbot content
 */
export const seedChatbotContent = async (req, res) => {
  await ChatbotService.seedInitialContent();
  
  res.status(200).json(
    new ApiResponse(200, null, 'Chatbot content seeded successfully')
  );
};

/**
 * Admin: Regenerate all embeddings
 */
export const regenerateAllEmbeddings = async (req, res) => {
  const content = await ChatbotContent.find({ isActive: true });
  
  for (const item of content) {
    await ChatbotService.generateContentEmbedding(item._id);
  }
  
  res.status(200).json(
    new ApiResponse(200, null, `Regenerated embeddings for ${content.length} items`)
  );
};