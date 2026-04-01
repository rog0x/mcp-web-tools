#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { webExtract } from "./tools/web-extract.js";
import { webMonitor } from "./tools/web-monitor.js";
import { webSearch } from "./tools/web-search.js";
import { htmlToMarkdown, urlToMarkdown } from "./tools/html-to-markdown.js";

const server = new Server(
  {
    name: "mcp-web-tools",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "web_extract",
      description:
        "Extract structured content from a URL: title, headings, paragraphs, links, images, and metadata",
      inputSchema: {
        type: "object" as const,
        properties: {
          url: { type: "string", description: "URL to extract content from" },
        },
        required: ["url"],
      },
    },
    {
      name: "web_search",
      description:
        "Search the web and return structured results with titles, URLs, and snippets. Uses Tavily API when TAVILY_API_KEY is set, otherwise falls back to DuckDuckGo",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: { type: "string", description: "Search query" },
          num_results: {
            type: "number",
            description: "Number of results (default: 10, max: 25)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "web_monitor",
      description:
        "Check if a website is up, measure response time, and get HTTP details",
      inputSchema: {
        type: "object" as const,
        properties: {
          url: { type: "string", description: "URL to monitor" },
        },
        required: ["url"],
      },
    },
    {
      name: "html_to_markdown",
      description:
        "Convert HTML content or a URL to clean, readable markdown. Removes scripts, styles, and navigation.",
      inputSchema: {
        type: "object" as const,
        properties: {
          url: { type: "string", description: "URL to fetch and convert" },
          html: {
            type: "string",
            description: "Raw HTML to convert (use instead of url)",
          },
        },
      },
    },
    {
      name: "web_multi_extract",
      description:
        "Extract content from multiple URLs in parallel. Returns results for each URL.",
      inputSchema: {
        type: "object" as const,
        properties: {
          urls: {
            type: "array",
            items: { type: "string" },
            description: "Array of URLs to extract content from",
          },
        },
        required: ["urls"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "web_extract": {
        const result = await webExtract(args?.url as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "web_search": {
        const numResults = Math.min((args?.num_results as number) || 10, 25);
        const results = await webSearch(args?.query as string, numResults);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "web_monitor": {
        const result = await webMonitor(args?.url as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "html_to_markdown": {
        let markdown: string;
        if (args?.url) {
          markdown = await urlToMarkdown(args.url as string);
        } else if (args?.html) {
          markdown = htmlToMarkdown(args.html as string);
        } else {
          throw new Error("Provide either 'url' or 'html' parameter");
        }
        return {
          content: [{ type: "text", text: markdown }],
        };
      }

      case "web_multi_extract": {
        const urls = args?.urls as string[];
        if (!urls || urls.length === 0) {
          throw new Error("Provide at least one URL");
        }
        const results = await Promise.allSettled(
          urls.slice(0, 10).map(async (url) => ({
            url,
            data: await webExtract(url),
          }))
        );
        const output = results.map((r, i) =>
          r.status === "fulfilled"
            ? r.value
            : { url: urls[i], error: (r.reason as Error).message }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Web Tools server running on stdio");
}

main().catch(console.error);
