export function createTraceId() {
  return `api_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function resolveTraceId(header: string | undefined): string {
  if (header && header.trim().length > 0) {
    return header.trim();
  }

  return createTraceId();
}

export function withTraceHeaders(headers: Record<string, string>, traceId: string) {
  return {
    ...headers,
    "X-Trace-Id": traceId,
  };
}

export function jsonError(code: string, message: string, status: number, traceId: string) {
  return Response.json(
    { code, message },
    {
      status,
      headers: withTraceHeaders({}, traceId),
    },
  );
}

export function createSvgResponse(svg: string, traceId: string) {
  return new Response(svg, {
    status: 200,
    headers: withTraceHeaders(
      {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
      traceId,
    ),
  });
}

export function parseSvgAssetId(assetName: string): string | null {
  return assetName.endsWith(".svg") ? assetName.slice(0, -4) : null;
}
