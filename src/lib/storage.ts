import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export interface StoredFile {
  storagePath: string;
  storageBucket: string | null;
  size: number;
  url: string | null;
}

async function ensureUploadDir(): Promise<void> {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch {}
}

export async function storeFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<StoredFile> {
  const storageProvider = process.env.STORAGE_PROVIDER;

  if (process.env.NODE_ENV === "production" && storageProvider !== "s3") {
    throw new Error(
      "Object storage is not configured. Set STORAGE_PROVIDER=s3 and provide S3 credentials for persistent document storage in production."
    );
  }

  if (storageProvider === "s3") {
    return storeFileS3(buffer, originalName, mimeType);
  }

  await ensureUploadDir();
  const id = crypto.randomBytes(16).toString("hex");
  const ext = path.extname(originalName);
  const filename = `${id}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(fullPath, buffer);
  return {
    storagePath: filename,
    storageBucket: null,
    size: buffer.length,
    url: null,
  };
}

export async function getFile(storagePath: string): Promise<Buffer> {
  const storageProvider = process.env.STORAGE_PROVIDER;
  if (storageProvider === "s3") {
    return getFileS3(storagePath);
  }
  const fullPath = path.join(UPLOAD_DIR, storagePath);
  return fs.readFile(fullPath);
}

export async function deleteFile(storagePath: string): Promise<void> {
  const storageProvider = process.env.STORAGE_PROVIDER;
  if (storageProvider === "s3") {
    return deleteFileS3(storagePath);
  }
  try {
    await fs.unlink(path.join(UPLOAD_DIR, storagePath));
  } catch {}
}

// ---- S3 object storage (optional, requires @aws-sdk/client-s3) ----

async function storeFileS3(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<StoredFile> {
  const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } =
    (await import("@aws-sdk/client-s3")) as any;
  const { getSignedUrl } = (await import("@aws-sdk/s3-request-presigner")) as any;

  const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });

  const key = `uploads/${crypto.randomBytes(16).toString("hex")}${path.extname(
    originalName
  )}`;
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return {
    storagePath: key,
    storageBucket: process.env.S3_BUCKET || null,
    size: buffer.length,
    url: null,
  };
}

async function getFileS3(storagePath: string): Promise<Buffer> {
  const { S3Client, GetObjectCommand } = (await import("@aws-sdk/client-s3")) as any;
  const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });
  const res = await client.send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: storagePath })
  );
  const chunks: Buffer[] = [];
  for await (const chunk of res.Body as any) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function deleteFileS3(storagePath: string): Promise<void> {
  const { S3Client, DeleteObjectCommand } = (await import("@aws-sdk/client-s3")) as any;
  const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });
  await client.send(
    new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: storagePath })
  );
}
