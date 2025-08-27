// models/ChatbotContent.js
import mongoose from 'mongoose';
import { CHATBOT_CONTENT_CATEGORY, CHATBOT_USER_TYPE } from '../utils/enums.js'



const chatbotContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    enum: Object.values(CHATBOT_CONTENT_CATEGORY),
    required: true,
  },
  userType: [{
    type: String,
    enum: Object.values(CHATBOT_USER_TYPE),
    default: ['all'],
  }],
  tags: [{
    type: String,
    trim: true,
  }],
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes for efficient searching
chatbotContentSchema.index({ category: 1, userType: 1 });
chatbotContentSchema.index({ tags: 1 });
chatbotContentSchema.index({ isActive: 1, priority: -1 });
chatbotContentSchema.index({ url: 1 });

export const ChatbotContent = mongoose.model('ChatbotContent', chatbotContentSchema);
