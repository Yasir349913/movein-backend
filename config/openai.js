// // config/openai.js
// import OpenAI from "openai";
// import { env } from "./env.js";

// export const openai = new OpenAI({
//   apiKey: env.OPENAI_API_KEY,
// });

// export const openaiConfig = {
//   models: {
//     gpt4: "gpt-4-turbo-preview",
//     gpt35: "gpt-3.5-turbo",
//     dalle3: "dall-e-3",
//     dalle2: "dall-e-2",
//   },
  
//   story: {
//     maxTokens: 2000,
//     temperature: 0.7,
//     topP: 1,
//     frequencyPenalty: 0.1,
//     presencePenalty: 0.1,
//   },
  
//   image: {
//     model: "dall-e-3",
//     size: "1024x1024",
//     quality: "standard",
//     style: "vivid",
//     n: 1,
//   },
// };

// // Helper function to get appropriate model based on age group
// export const getModelForAge = (ageRange) => {
//   switch (ageRange) {
//     case "0-2":
//     case "3-5":
//       return openaiConfig.models.gpt35; // Simpler stories for younger kids
//     case "6-9":
//     case "10+":
//       return openaiConfig.models.gpt4; // More complex stories for older kids
//     default:
//       return openaiConfig.models.gpt35;
//   }
// };