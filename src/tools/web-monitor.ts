export interface MonitorResult {
  url: string;
  status: "up" | "down";
  statusCode: number | null;
  responseTimeMs: number;
  headers: Record<string, string>;
  sslValid: boolean;
  redirects: string[];
  error: string | null;
}

export async function webMonitor(url: string): Promise<MonitorResult> {
  const start = performance.now();
  const redirects: string[] = [];

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "MCP-Web-Monitor/1.0",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    const responseTimeMs = Math.round(performance.now() - start);

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      url,
      status: response.ok ? "up" : "down",
      statusCode: response.status,
      responseTimeMs,
      headers,
      sslValid: url.startsWith("https://"),
      redirects,
      error: response.ok ? null : `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (err: any) {
    const responseTimeMs = Math.round(performance.now() - start);
    return {
      url,
      status: "down",
      statusCode: null,
      responseTimeMs,
      headers: {},
      sslValid: false,
      redirects,
      error: err.message || "Unknown error",
    };
  }
}
