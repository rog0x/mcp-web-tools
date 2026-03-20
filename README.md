# MCP Web Tools

A powerful MCP (Model Context Protocol) server that gives AI agents web superpowers. Extract content, search the web, monitor sites, and convert HTML to markdown — all through a clean tool interface.

## Tools

| Tool | Description |
|------|-------------|
| `web_extract` | Extract structured content from any URL (title, headings, paragraphs, links, images, metadata) |
| `web_search` | Search the web via Tavily (when configured) or DuckDuckGo |
| `web_monitor` | Check if a site is up, measure response time, get HTTP headers |
| `html_to_markdown` | Convert any URL or HTML to clean markdown |
| `web_multi_extract` | Extract content from multiple URLs in parallel |

## Installation

### For Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "web-tools": {
      "command": "npx",
      "args": ["@rog0x/mcp-web-tools"]
    }
  }
}
```

### For Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "web-tools": {
      "command": "npx",
      "args": ["@rog0x/mcp-web-tools"]
    }
  }
}
```

### Manual Installation

```bash
npm install -g @rog0x/mcp-web-tools
mcp-web-tools
```

## Usage Examples

### Extract content from a webpage
```
Use web_extract to get the main content from https://example.com
```

### Search the web
```
Use web_search to find "best TypeScript frameworks 2026"
```

### Monitor a website
```
Use web_monitor to check if https://api.example.com is responding
```

### Convert page to markdown
```
Use html_to_markdown to convert https://docs.example.com/guide to readable markdown
```

### Batch extraction
```
Use web_multi_extract to get content from these URLs: [url1, url2, url3]
```

## Optional: Tavily Search

For higher-quality search results, you can configure [Tavily](https://tavily.com) as the search backend. When `TAVILY_API_KEY` is set, `web_search` routes queries through the Tavily API. Without the key, DuckDuckGo is used as the default fallback.

1. Get a free API key at https://app.tavily.com (1,000 free credits/month)
2. Set the environment variable:
   ```bash
   export TAVILY_API_KEY="tvly-YOUR_API_KEY"
   ```
3. Or add it to your MCP server config:
   ```json
   {
     "mcpServers": {
       "web-tools": {
         "command": "npx",
         "args": ["@rog0x/mcp-web-tools"],
         "env": {
           "TAVILY_API_KEY": "tvly-YOUR_API_KEY"
         }
       }
     }
   }
   ```

## Features

- **No API keys required** — uses DuckDuckGo for search by default, direct HTTP for everything else
- **Optional Tavily integration** — set `TAVILY_API_KEY` for higher-quality search results
- **Fast** — parallel extraction, 15s timeout per request
- **Clean output** — strips scripts, styles, ads; extracts meaningful content
- **Lightweight** — minimal dependencies, no headless browser needed
- **Production-ready** — proper error handling, timeouts, input validation

## Requirements

- Node.js 18+

## License

MIT — rog0x
