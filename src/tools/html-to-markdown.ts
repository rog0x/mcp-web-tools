import TurndownService from "turndown";
import * as cheerio from "cheerio";

export function htmlToMarkdown(html: string, options?: { baseUrl?: string }): string {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $("script, style, noscript, iframe, nav, footer, header").remove();

  // Get main content area if available
  const mainContent =
    $("main").html() ||
    $("article").html() ||
    $('[role="main"]').html() ||
    $(".content").html() ||
    $("body").html() ||
    html;

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
  });

  // Handle code blocks
  turndown.addRule("codeBlock", {
    filter: (node) => {
      return node.nodeName === "PRE" && !!node.querySelector("code");
    },
    replacement: (_, node) => {
      const code = (node as HTMLElement).querySelector("code");
      if (!code) return "";
      const lang = code.className?.match(/language-(\w+)/)?.[1] || "";
      return `\n\`\`\`${lang}\n${code.textContent?.trim()}\n\`\`\`\n`;
    },
  });

  let markdown = turndown.turndown(mainContent || "");

  // Clean up excessive whitespace
  markdown = markdown
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "")
    .trim();

  return markdown;
}

export async function urlToMarkdown(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  return htmlToMarkdown(html, { baseUrl: url });
}
