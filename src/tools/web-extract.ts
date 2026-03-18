import * as cheerio from "cheerio";

export interface ExtractedContent {
  title: string;
  description: string;
  headings: { level: number; text: string }[];
  paragraphs: string[];
  links: { text: string; href: string }[];
  images: { alt: string; src: string }[];
  metadata: Record<string, string>;
}

export async function webExtract(url: string): Promise<ExtractedContent> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove script and style elements
  $("script, style, noscript").remove();

  const title = $("title").text().trim();
  const description =
    $('meta[name="description"]').attr("content")?.trim() || "";

  const headings: { level: number; text: string }[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tag = $(el).prop("tagName");
    if (tag) {
      headings.push({
        level: parseInt(tag.replace("H", "")),
        text: $(el).text().trim(),
      });
    }
  });

  const paragraphs: string[] = [];
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20) paragraphs.push(text);
  });

  const links: { text: string; href: string }[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (text && href && !href.startsWith("#") && !href.startsWith("javascript:")) {
      links.push({ text, href: href.startsWith("http") ? href : new URL(href, url).href });
    }
  });

  const images: { alt: string; src: string }[] = [];
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src") || "";
    const alt = $(el).attr("alt") || "";
    if (src) {
      images.push({ alt, src: src.startsWith("http") ? src : new URL(src, url).href });
    }
  });

  const metadata: Record<string, string> = {};
  $("meta[name], meta[property]").each((_, el) => {
    const name = $(el).attr("name") || $(el).attr("property") || "";
    const content = $(el).attr("content") || "";
    if (name && content) metadata[name] = content;
  });

  return { title, description, headings, paragraphs: paragraphs.slice(0, 50), links: links.slice(0, 100), images: images.slice(0, 50), metadata };
}
