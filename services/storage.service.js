// services/storage.service.js
import { s3, awsConfig, generateS3Key, getPublicUrl } from "../config/index.js";
import { v4 as uuidv4 } from "uuid";

class StorageService {
  async uploadFile(file, folder, userId = null) {
    try {
      const filename = `${uuidv4()}_${file.originalname}`;
      const key = generateS3Key(folder, filename, userId);
      console.log(key);
      const uploadParams = {
        Bucket: awsConfig.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read',
      };
      
      const result = await s3.upload(uploadParams).promise();
      console.log("Public URL: ", getPublicUrl(key));
      return getPublicUrl(key);
      
    } catch (error) {
      console.error("File upload failed:", error);
      throw new Error("Failed to upload file");
    }
  }
  
  async uploadBuffer(buffer, filename, folder, userId = null) {
    try {
      const key = generateS3Key(folder, filename, userId);
      
      const uploadParams = {
        Bucket: awsConfig.bucket,
        Key: key,
        Body: buffer,
        ContentType: this.getContentType(filename),
        // ACL: 'public-read',
      };
      
      const result = await s3.upload(uploadParams).promise();
      return getPublicUrl(key);
      
    } catch (error) {
      console.error("Buffer upload failed:", error);
      throw new Error("Failed to upload buffer");
    }
  }
  
  async storeGeneratedImage(imageUrl, filename, userId = null) {
    try {
      // Download image from URL
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();
      
      // Upload to S3
      return await this.uploadBuffer(
        Buffer.from(imageBuffer),
        `${filename}.png`,
        "generatedImages",
        userId
      );
      
    } catch (error) {
      console.error("Generated image storage failed:", error);
      throw new Error("Failed to store generated image");
    }
  }
  
  async deleteFile(fileUrl) {
    try {
      // Extract key from URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      
      const deleteParams = {
        Bucket: awsConfig.bucket,
        Key: key,
      };
      
      await s3.deleteObject(deleteParams).promise();
      
    } catch (error) {
      console.error("File deletion failed:", error);
      throw new Error("Failed to delete file");
    }
  }
  
  async generateSignedUrl(key, expiresIn = 3600) {
    try {
      const signedUrl = await s3.getSignedUrlPromise('getObject', {
        Bucket: awsConfig.bucket,
        Key: key,
        Expires: expiresIn,
      });
      
      return signedUrl;
      
    } catch (error) {
      console.error("Signed URL generation failed:", error);
      throw new Error("Failed to generate signed URL");
    }
  }
  
  getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const contentTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }
}

export const storageService = new StorageService();