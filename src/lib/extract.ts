import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
export const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/msword",
]);
export const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt", ".doc"]);

export interface ExtractionResult {
  text: string;
  pageCount?: number;
  ocrUsed: boolean;
  language?: string;
  _error?: string;
}

export type ExtractionStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface UploadedFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export function validateFile(file: UploadedFile): { ok: true } | { ok: false; error: string } {
  const ext = path.extname(file.originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, error: `Unsupported file type: ${ext || "unknown"}` };
  }
  if (!ALLOWED_MIME.has(file.mimeType)) {
    return { ok: false, error: `Unsupported MIME type: ${file.mimeType}` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: `File too large (max ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB)` };
  }
  if (file.size === 0) {
    return { ok: false, error: "Empty file" };
  }
  return { ok: true };
}

export async function extractText(file: UploadedFile): Promise<ExtractionResult> {
  const ext = path.extname(file.originalName).toLowerCase();

  if (ext === ".pdf") {
    return extractPdf(file.buffer);
  }
  if (ext === ".docx" || ext === ".doc") {
    return extractDocx(file.buffer);
  }
  if (ext === ".txt") {
    const text = file.buffer.toString("utf-8");
    return { text, pageCount: undefined, ocrUsed: false };
  }

  return { text: "", pageCount: undefined, ocrUsed: false };
}

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const data = await (PDFParse as any)(buffer);
    const text = data.text || "";
    return { text, pageCount: data.npages, ocrUsed: false };
  } catch (err: any) {
    return { text: "", pageCount: undefined, ocrUsed: false, _error: err.message };
  }
}

async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || "";
    return { text, pageCount: undefined, ocrUsed: false };
  } catch (err: any) {
    return { text: "", pageCount: undefined, ocrUsed: false, _error: err.message };
  }
}

export function extractError(result: ExtractionResult): string | undefined {
  return (result as ExtractionResult & { _error?: string })._error;
}
