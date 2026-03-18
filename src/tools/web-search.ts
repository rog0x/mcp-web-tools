import * as cheerio from "cheerio";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function webSearch(query: string, numResults: number = 10): Promise<SearchResult[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encoded}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Search failed: HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $(".result").each((i, el) => {
    if (i >= numResults) return false;

    const titleEl = $(el).find(".result__title a");
    const snippetEl = $(el).find(".result__snippet");

    const title = titleEl.text().trim();
    let href = titleEl.attr("href") || "";

    // DuckDuckGo wraps URLs in redirects
    const udMatch = href.match(/uddg=([^&]+)/);
    if (udMatch) {
      href = decodeURIComponent(udMatch[1]);
    }

    const snippet = snippetEl.text().trim();

    if (title && href) {
      results.push({ title, url: href, snippet });
    }
  });

  return results;
}
