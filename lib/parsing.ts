import mammoth from "mammoth";

export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    // Lazy-required: pdf-parse touches the filesystem on import in some
    // versions, so importing it only when needed avoids build-time issues.
    const pdfParse = (await import("pdf-parse")) as any;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === "txt" || ext === "md") {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file type: .${ext}`);
}