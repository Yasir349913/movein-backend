// config/aws.js
import AWS from "aws-sdk";
import { env } from "./env.js";

AWS.config.update({
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION,
});

export const s3 = new AWS.S3();

export const awsConfig = {
  bucket: env.AWS_S3_BUCKET,
  region: env.AWS_REGION,
  
  folders: {
    characters: "characters/",
    originalImages: "characters/original/",
    processedImages: "characters/processed/",
    generatedImages: "generated-images/",
    pdfs: "generated-pdfs/",
    temp: "temp/",
    icons: "icons/",
    previews: "previews/",
  },
  
  upload: {
    maxSize: env.MAX_FILE_SIZE,
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  },
  
  // CDN/CloudFront Settings
  cloudfront: {
    domain: process.env.CLOUDFRONT_DOMAIN || null,
  },
  
  // Signed URL Expiration
  signedUrlExpiry: 60 * 60, // 1 hour
};

// Helper function to generate S3 key
export const generateS3Key = (folder, filename, userId = null) => {
  const timestamp = Date.now();
  const userPath = userId ? `${userId}/` : "";
  return `${awsConfig.folders[folder]}${userPath}${timestamp}_${filename}`;
};

// Helper function to get public URL
export const getPublicUrl = (key) => {
  // if (awsConfig.cloudfront.domain) {
  //   return `https://${awsConfig.cloudfront.domain}/${key}`;
  // }
  return `https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`;
};