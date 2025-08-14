// services/storage.service.js
import { s3, presignGet, presignPut, publicUrl, BUCKET } from "../config/index.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// simple key builder (folder/userId are optional)
function buildKey(folder, filename, userId) {
  const prefix = [folder, userId]
    .filter(Boolean)
    .map(s => String(s).replace(/^\/+|\/+$/g, "")) // trim slashes
    .join("/");
  return `${prefix ? prefix + "/" : ""}${uuidv4()}_${filename}`;
}

function guessContentType(filename) {
  const ext = String(filename).split(".").pop()?.toLowerCase();
  const map = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    pdf: "application/pdf",
    txt: "text/plain",
    mp4: "video/mp4",
  };
  return map[ext] || "application/octet-stream";
}

function keyFromUrl(fileUrlOrKey) {
  try {
    const u = new URL(fileUrlOrKey);
    // works for both S3 and CloudFront-style URLs
    return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
  } catch {
    // not a URL, assume it's already a key
    return fileUrlOrKey;
  }
}

class StorageService {
  async uploadFile(file, folder, userId = null) {
    try {
      const key = buildKey(folder, file.originalname, userId);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype || guessContentType(file.originalname),
        })
      );
      return publicUrl(key);
    } catch (error) {
      console.error("File upload failed:", error);
      throw new Error("Failed to upload file");
    }
  }

  async uploadBuffer(buffer, filename, folder, userId = null) {
    try {
      const key = buildKey(folder, filename, userId);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: guessContentType(filename),
        })
      );
      return publicUrl(key);
    } catch (error) {
      console.error("Buffer upload failed:", error);
      throw new Error("Failed to upload buffer");
    }
  }

  async storeGeneratedImage(imageUrl, filename, userId = null) {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      return await this.uploadBuffer(buf, `${filename}.png`, "generated", userId);
    } catch (error) {
      console.error("Generated image storage failed:", error);
      throw new Error("Failed to store generated image");
    }
  }

  async deleteFile(fileUrlOrKey) {
    try {
      const key = keyFromUrl(fileUrlOrKey);
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch (error) {
      console.error("File deletion failed:", error);
      throw new Error("Failed to delete file");
    }
  }

  async generateSignedUrl(key, expiresIn = 3600) {
    try {
      return await presignGet({ key, expiresIn });
    } catch (error) {
      console.error("Signed URL generation failed:", error);
      throw new Error("Failed to generate signed URL");
    }
  }

  // Optional helper if you want a presigned PUT for browser uploads
  async generateUploadUrl(key, contentType, expiresIn = 3600) {
    return presignPut({ key, contentType, expiresIn });
  }

  // keep compatibility if other code calls this
  getContentType(filename) {
    return guessContentType(filename);
  }
}

export const storageService = new StorageService();
