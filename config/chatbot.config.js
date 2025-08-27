// config/chatbot.config.js
import mcs from 'mongodb-chatbot-server';
import { MongoClient } from 'mongodb';
import { stripIndents } from 'common-tags';
import { env } from './index.js'; // <-- your env file path (you showed 'config/env.js')

// If you added these earlier:
import { makeRerankingFindContent } from '../utils/rerank.util.js';
import { makeOpenAiResponsesLlm } from '../llm/openai.responses.js';

// --- pull only what we need from the CJS package ---
const {
  makeMongoDbEmbeddedContentStore,
  makeOpenAiEmbedder,
  makeMongoDbConversationsService,
  makeDefaultFindContent,
  makeRagGenerateUserPrompt,
  // DO NOT import CORE_ENV_VARS or assertEnvVars from the package
  mongoDbUserQueryPreprocessor: _mongoDbUserQueryPreprocessor,
} = mcs;

// Fallback if not exported by your package version
const mongoDbUserQueryPreprocessor =
  _mongoDbUserQueryPreprocessor ??
  (async ({ query }) => ({ query, rejectQuery: false }));

// --- local, minimal env assertion (no Azure/OpenAI-deployment vars) ---
function assertLocalEnvVars(obj) {
  const missing = Object.entries(obj)
    .filter(([, v]) => v === undefined || v === null || v === '')
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(`Missing env var(s):\n- ${missing.join('\n- ')}`);
  }
}

// --- only the vars you actually use ---
const requiredEnvVars = {
  OPENAI_API_KEY: env.OPENAI_API_KEY,
  OPENAI_CHAT_COMPLETION_MODEL: env.OPENAI_CHAT_COMPLETION_MODEL || 'gpt-4o-mini',
  OPENAI_EMBEDDING_MODEL: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  // Use your env.MONGODB_URI & env.DB_NAME names (not MONGODB_CONNECTION_URI/NAME)
  MONGODB_URI: env.MONGODB_URI,
  DB_NAME: env.DB_NAME || 'moveinn',
  VECTOR_SEARCH_INDEX_NAME: env.VECTOR_SEARCH_INDEX_NAME || 'vector_index',
  // Optional
  //COHERE_API_KEY: env.COHERE_API_KEY || '',
};

assertLocalEnvVars(requiredEnvVars);

// --- MongoDB client setup ---
const mongodb = new MongoClient(requiredEnvVars.MONGODB_URI);
const database = mongodb.db(requiredEnvVars.DB_NAME);

// --- Embedder ---
const embedder = makeOpenAiEmbedder({
  apiKey: requiredEnvVars.OPENAI_API_KEY,
  model: requiredEnvVars.OPENAI_EMBEDDING_MODEL,
  backoffOptions: { numOfAttempts: 5, startingDelay: 1000 },
});

// --- Embedded content store ---
// --- Embedded content store ---
const embeddedContentStore = makeMongoDbEmbeddedContentStore({
  connectionUri: requiredEnvVars.MONGODB_URI,
  databaseName: requiredEnvVars.DB_NAME,

  // optional: customise the collection; defaults vary by package version
  collectionName: 'embeddedContent',

  // REQUIRED by your package version
  searchIndex: {
    // Atlas Search index name
    indexName: requiredEnvVars.VECTOR_SEARCH_INDEX_NAME,

    // The vector field name in your docs
    embeddingName: 'embedding',

    // Dimensions must match your embedding model
    // 1536 for text-embedding-3-small, 3072 for text-embedding-3-large
    numDimensions:
      (requiredEnvVars.OPENAI_EMBEDDING_MODEL || '').includes('3-large') ? 3072 : 1536,

    // Optional: fields you plan to filter on in queries
    filters: [
      'metadata.category',
      'metadata.userType',
      'metadata.tags',
      'metadata.priority',
      'metadata.contentId',
      'metadata.collection',
      'metadata.chunkIndex',
      // listing-oriented:
      'metadata.city',
      'metadata.bedrooms',
      'metadata.price',
      'metadata.availabilityDate'
    ]
  }
});


// --- Conversations service ---
const conversations = makeMongoDbConversationsService(database);

// --- LLM (Responses API adapter) ---
// If you haven’t added this adapter, you can swap back to your makeOpenAiChatLlm
const llm = makeOpenAiResponsesLlm({
  apiKey: requiredEnvVars.OPENAI_API_KEY,
  model: requiredEnvVars.OPENAI_CHAT_COMPLETION_MODEL,
  temperature: 0.6,
});

// --- Retrieval (base) ---
const baseFindContent = makeDefaultFindContent({
  embedder,
  store: embeddedContentStore,
  findNearestNeighborsOptions: {
    k: 12,
    path: 'embedding',
    indexName: requiredEnvVars.VECTOR_SEARCH_INDEX_NAME,
    minScore: 0.80,
  },
});

// --- Retrieval (with reranking) ---
const findContent = makeRerankingFindContent({
  baseFindContent,
  cohereApiKey: requiredEnvVars.COHERE_API_KEY, // empty string disables rerank gracefully
  topN: 6,
});

// --- System prompt ---
const systemPrompt = {
  role: 'system',
  content: stripIndents`
    You are MoveInn AI, a helpful assistant for the MoveInn platform—a comprehensive rental housing solution.

    MoveInn connects tenants, landlords, agencies, universities, and banks in a complete rental ecosystem.

    Key features you can help with:
    - Property search and listings
    - Rental applications and contracts
    - Payment processing and rent collection
    - Roommate matching services
    - University partnerships and student discounts
    - Background checks and verification
    - Dispute resolution
    - Account management

    Always be helpful, professional, and grounded in the provided context.
    Use ONLY the supplied context and the user's messages for platform specifics.
    If the context doesn't contain an answer, say so briefly and offer next steps or support.
    When referencing fees, pricing, or policies, cite or include the specific MoveInn URL from the context.
  `,
};

// --- User message builder ---
const makeUserMessage = ({ query, content, userType }) => ({
  role: 'user',
  content: stripIndents`
    User Type: ${userType || 'unknown'}

    Context information is below.
    ---------------------
    ${content.map(({ text, url }) => `${text}\n\nSource: ${url}`).join('\n\n')}
    ---------------------
    Using the context information and not prior knowledge, answer the query about MoveInn.
    If the context doesn't contain relevant information, say so and provide general guidance.

    Query: ${query}
  `,
});

// --- Query preprocessors (chain) ---
const moveinnQueryPreprocessor = async ({ query }) => {
  const enhancedQuery = `${query} (MoveInn platform context)`;
  return { query: enhancedQuery, rejectQuery: false };
};

const chainPreprocessor = async ({ query, messages }) => {
  const step1 = await mongoDbUserQueryPreprocessor({ query, messages });
  const step2 = await moveinnQueryPreprocessor({ query: step1.query, messages });
  return {
    query: step2.query,
    rejectQuery: step1.rejectQuery || step2.rejectQuery || false,
  };
};

// --- RAG user prompt generator ---
const generateUserPrompt = makeRagGenerateUserPrompt({
  findContent,
  queryPreprocessor: chainPreprocessor,
  makeUserMessage,
});

// --- App configuration ---
const chatbotConfig = {
  conversationsRouterConfig: {
    llm,
    conversations,
    generateUserPrompt,
    systemPrompt,
  },
  maxRequestTimeoutMs: 30000,
  corsOptions: {
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : [env.CLIENT_URL],
    credentials: true,
  },
};

export {
  chatbotConfig,
  mongodb,
  embedder,
  embeddedContentStore,
  findContent,
  requiredEnvVars,
};
