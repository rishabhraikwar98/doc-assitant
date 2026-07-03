const EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";


async function embedOne(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
  retries = 3
): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${EMBED_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: 768,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.embedding.values;
    }

    // 429 = rate limited. Back off and retry rather than failing the
    // whole ingestion over a transient quota hit.
    if (res.status === 429 && attempt < retries) {
      const waitMs = 1000 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    const body = await res.text();
    throw new Error(`Gemini embedding request failed: ${res.status} ${body}`);
  }

  throw new Error("Gemini embedding request failed after retries");
}

// Used at ingestion time — one embedding per chunk.
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedOne(text, "RETRIEVAL_DOCUMENT"));
  }
  return results;
}

// Used at query time (Phase 3) — task type differs from documents,
// which measurably improves retrieval quality for this model.
export async function embedQuery(text: string): Promise<number[]> {
  return embedOne(text, "RETRIEVAL_QUERY");
}