// config/aws.js
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env.config.js";

export const REGION = env.AWS_REGION;
export const BUCKET = env.AWS_S3_BUCKET;

export const s3 = new S3Client({ region: REGION }); // relies on env/role creds

export async function presignPut({ key, contentType, expiresIn = 3600 }) {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(s3, cmd, { expiresIn });
}

export async function presignGet({ key, expiresIn = 3600 }) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}

// Optional helper if you keep objects public or use them behind CloudFront:
export function publicUrl(key) {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
}
