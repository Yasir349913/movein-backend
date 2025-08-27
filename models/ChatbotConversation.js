
// models/ChatbotConversation.js
import mongoose from 'mongoose';
import { CHATBOT_CONVERSATION_USER_TYPE, CHATBOT_MESSAGE_ROLE } from '../utils/enums.js';
const conversationSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true, // Allow anonymous conversations
  },
  userType: {
    type: String,
    enum: Object.values(CHATBOT_CONVERSATION_USER_TYPE),
    default: 'anonymous',
  },
  messages: [{
    id: String,
    role: {
      type: String,
      enum: Object.values(CHATBOT_MESSAGE_ROLE),
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
    timestamp: Date,
  },
}, {
  timestamps: true,
});

// Indexes
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userType: 1, createdAt: -1 });
conversationSchema.index({ isActive: 1, updatedAt: -1 });

export const ChatbotConversation = mongoose.model('ChatbotConversation', conversationSchema);

