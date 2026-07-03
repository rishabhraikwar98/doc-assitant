// Fixed-size chunking with overlap. Overlap preserves context across
// chunk boundaries so a sentence split mid-chunk isn't orphaned.
export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 150
): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const chunk = cleaned.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end === cleaned.length) break;
    start = end - overlap; // step back by the overlap amount
  }

  return chunks;
}