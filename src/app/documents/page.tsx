"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Plus, Upload, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Material {
  id: string;
  title: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  extractedDocument?: {
    extractionStatus: string;
    errorMessage: string | null;
    cleanedText: string | null;
    rawText: string | null;
    pageCount: number | null;
    ocrUsed: boolean;
  } | null;
}

export default function DocumentsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/documents", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load documents");
      setMaterials(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      load();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }, []);

  async function extract(materialId: string) {
    setExtracting(materialId);
    try {
      const res = await fetch(`/api/documents/${materialId}/extract`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      load();
    } catch (err: any) {
      setError(err.message || "Extraction failed");
    } finally {
      setExtracting(null);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Upload Center</h1>
          <p className="text-muted-foreground">Upload PDF, DOCX, or TXT materials. We&rsquo;ll extract the text so you can build reviewers, quizzes, and flashcards.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => fileInput.current?.click()} disabled={uploading} className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Upload document
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {materials.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="font-medium text-foreground">No documents yet</h3>
            <p className="text-sm">Upload your first learning material to begin.</p>
          </div>
        ) : (
          materials.map((m) => {
            const extracted = m.extractedDocument;
            const status = extracted?.extractionStatus || "PENDING";
            const statusLabel =
              status === "COMPLETED" ? "Extracted" : status === "FAILED" ? "Failed" : "Pending";
            const statusVariant =
              status === "COMPLETED" ? "secondary" : status === "FAILED" ? "destructive" : "default";
            return (
              <Card key={m.id} className="hover:bg-accent transition-colors group">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold line-clamp-1 text-foreground">{m.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.originalName}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(m.fileSize)} · {m.mimeType}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant} className="text-xs">
                      {statusLabel}
                    </Badge>
                    {extracted?.ocrUsed && <Badge variant="outline" className="text-xs">OCR used</Badge>}
                  </div>
                  {status === "FAILED" && extracted?.errorMessage && (
                    <p className="text-xs text-destructive">{truncate(extracted.errorMessage, 100)}</p>
                  )}
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  {status === "PENDING" ? (
                    <Button size="sm" onClick={() => extract(m.id)} disabled={extracting === m.id}>
                      {extracting === m.id ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null} Extract
                    </Button>
                  ) : status === "FAILED" ? (
                    <Button size="sm" onClick={() => extract(m.id)} disabled={extracting === m.id}>
                      Retry
                    </Button>
                  ) : (
                    <Link href={`/reviewer?material=${m.id}`} className="text-xs text-primary underline flex items-center gap-1">
                      Use material <span>→</span>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function truncate(text: string, len: number) {
  if (!text) return "";
  return text.length <= len ? text : text.slice(0, len) + "…";
}
