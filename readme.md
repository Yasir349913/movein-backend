# 📚 AI Storybook Generator

> Personalized AI-powered storybooks for children with custom characters and themes

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/your-username/ai-storybook-generator.git
cd ai-storybook-generator

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Configure your API keys and database

# Start development server
npm run dev

# Start background jobs
npm run queue:start
```

## 📋 Features

- **Age-Appropriate Content**: 0-2, 3-5, 6-9, 10+ age groups
- **Multiple Themes**: Educational, Fairy Tales, Adventure, Holidays, etc.
- **Custom Characters**: Upload up to 5 personal character images
- **AI Illustration**: 10+ illustration styles (Watercolor, 3D Animation, etc.)
- **Custom Fonts**: Child-friendly typography options
- **PDF Generation**: High-quality downloadable storybooks
- **Secure Payment**: Stripe integration
- **Progress Saving**: Multi-step form with session management

## 🏗️ Architecture

```
Frontend (React/Next.js) → Backend API (Node.js/Express) → AI Services (OpenAI/DALL-E)
                        ↓
                    MongoDB Database
                        ↓
                    Queue System (Redis/Bull)
                        ↓
                    File Storage (AWS S3)
```

## 📊 Database Schema

### Core Models
- **User**: Authentication and profile
- **Book**: Main storybook entity with AI generation data
- **Character**: Custom user characters (max 5 per book)
- **Payment**: Stripe payment processing
- **Configuration**: Age groups, themes, styles, fonts

### Relationships
```
User (1) → (many) Books (1) → (many) Characters
Book (1) → (1) Payment
Book (many) → (1) AgeGroup/Theme/SubTheme/Message/Style/Font
```

## 🔄 AI Generation Flow

1. **Story Planning**: Generate age-appropriate story structure
2. **Character Processing**: Style user images for consistency
3. **Parallel Generation**: Create text + images simultaneously
4. **PDF Assembly**: Combine content with selected fonts
5. **Delivery**: Email notification + download link

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Queue**: Redis + Bull Queue
- **Storage**: AWS S3
- **Payment**: Stripe

### AI Services
- **Text Generation**: OpenAI GPT-4
- **Image Generation**: DALL-E 3
- **PDF Creation**: PDFLib

### Frontend (Optional)
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **State**: Redux Toolkit
- **Forms**: React Hook Form

## 📁 Project Structure

```
/storybook-backend
├── config/
│   ├── db.js                 # MongoDB connection
│   ├── env.js                # Load and expose env variables
│   ├── openai.js             # OpenAI/DALL-E config
│   ├── stripe.js             # Payment gateway config
│   ├── aws.js                # S3 storage config
│   └── index.js              # Central export of configs
│
├── controllers/
│   ├── auth.controller.js    # User authentication
│   ├── book.controller.js    # Book creation & management
│   ├── config.controller.js  # Age groups, themes, styles
│   ├── character.controller.js # Character upload & processing
│   ├── payment.controller.js # Payment processing
│   ├── generation.controller.js # AI story generation
│   └── index.js              # Export all controllers
│
├── middlewares/
│   ├── auth.js               # JWT authentication
│   ├── validation.js         # Request validation
│   ├── upload.js             # File upload handling
│   ├── errorHandler.js       # Express error middleware
│   ├── rateLimit.js          # API rate limiting
│   └── index.js              # Export all middlewares
│
├── models/
│   ├── User.js
│   ├── Book.js
│   ├── Character.js
│   ├── Payment.js
│   ├── AgeGroup.js
│   ├── Theme.js
│   ├── SubTheme.js
│   ├── CentralMessage.js
│   ├── IllustrationStyle.js
│   ├── FontStyle.js
│   ├── Pricing.js
│   ├── BookDraft.js
│   └── index.js              # Central schema exports
│
├── routes/
│   ├── auth.routes.js        # Authentication endpoints
│   ├── book.routes.js        # Book CRUD operations
│   ├── config.routes.js      # Configuration data
│   ├── character.routes.js   # Character management
│   ├── payment.routes.js     # Payment processing
│   ├── generation.routes.js  # AI generation status
│   └── index.js              # Aggregate all route definitions
│
├── services/
│   ├── ai.service.js         # OpenAI integration
│   ├── image.service.js      # DALL-E image generation
│   ├── pdf.service.js        # PDF generation
│   ├── storage.service.js    # S3 file operations
│   ├── payment.service.js    # Stripe integration
│   ├── email.service.js      # Email notifications
│   └── index.js              # Export service logic
│
├── jobs/
│   ├── storyGeneration.job.js # AI story creation
│   ├── pdfGeneration.job.js   # PDF assembly
│   ├── cleanup.job.js         # Temp file cleanup
│   ├── scheduler.js           # Job scheduling
│   └── index.js               # Expose all jobs
│
├── utils/
│   ├── logger.js              # Winston logging
│   ├── constants.js           # App constants
│   ├── response.js            # Standard API responses
│   ├── prompts.js             # AI prompt templates
│   ├── validation.js          # Joi schemas
│   └── index.js               # Utility exports
│
├── uploads/                   # Temporary file storage
├── tests/                     # Unit & integration tests
├── docs/                      # API documentation
├── scripts/                   # Database seeds, migrations
├── .env
├── app.js                     # Express app with middleware + routing
├── server.js                  # Entry point: listen + express-async-errors
├── package.json
└── README.md
```

## 🔧 Configuration

### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/storybook_db

# AI Services
OPENAI_API_KEY=your_openai_key
DALLE_API_KEY=your_dalle_key

# Storage & Payment
AWS_S3_BUCKET=your_s3_bucket
STRIPE_SECRET_KEY=your_stripe_secret

# Queue & Cache
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret_32_chars_min
```

## 📊 Pricing Logic

```javascript
// Base pricing structure
const pricing = {
  "0-2": { base: 9.99, characterPrice: 2.00 },
  "3-5": { base: 12.99, characterPrice: 2.50 },
  "6-9": { base: 15.99, characterPrice: 3.00 },
  "10+": { base: 18.99, characterPrice: 3.50 }
};

// Premium styles add 20%
// Characters 3-5 incur additional charges
```

## 🚦 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
GET  /api/auth/verify/:token # Email verification
```

### Book Creation
```
GET  /api/config/:type      # Get configuration data
POST /api/books/draft       # Save progress
POST /api/books/create      # Create final book
GET  /api/books/:id/status  # Check generation status
GET  /api/books/:id/download # Download PDF
```

### Payment
```
POST /api/payment/create-intent    # Create payment intent
POST /api/payment/webhook          # Stripe webhook
GET  /api/payment/:id/status       # Payment status
```

## 🔒 Security Features

- **JWT Authentication**: Secure user sessions
- **Input Validation**: Joi schema validation
- **File Upload**: Multer with size/type restrictions
- **Rate Limiting**: Prevent API abuse
- **CORS**: Configurable cross-origin requests
- **Helmet**: Security headers
- **Data Sanitization**: Prevent NoSQL injection

## 📈 Performance Optimizations

- **Caching**: Redis for configuration data
- **Queue System**: Background processing for AI generation
- **Image Optimization**: Compress uploaded images
- **CDN**: S3 + CloudFront for file delivery
- **Database Indexing**: Optimized queries
- **Parallel Processing**: Simultaneous text/image generation

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "AI Generation"

# Coverage report
npm run test:coverage

# Load testing
npm run test:load
```

## 📚 API Documentation

```bash
# Generate API docs
npm run docs:generate

# Serve documentation
npm run docs:serve
# Visit: http://localhost:3001/docs
```

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t storybook-api .

# Run container
docker run -p 3000:3000 --env-file .env storybook-api
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Redis cluster setup
- [ ] S3 bucket permissions
- [ ] Stripe webhooks configured
- [ ] SSL certificates installed
- [ ] Monitoring enabled
- [ ] Backup strategy implemented

## 📊 Monitoring & Analytics

### Metrics to Track
- **Generation Time**: Story + image creation duration
- **Success Rate**: Completed vs failed generations
- **User Journey**: Drop-off points in form
- **Revenue**: Daily/monthly sales
- **API Performance**: Response times, error rates

### Recommended Tools
- **Application**: New Relic / DataDog
- **Database**: MongoDB Compass
- **Queue**: Bull Dashboard
- **Errors**: Sentry
- **Analytics**: Google Analytics + Custom events

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: support@yourdomain.com
- **Discord**: [Community Server](https://discord.gg/your-server)

---

**Happy Storytelling! 📖✨**