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

export function createApiErrorPayload<TExtra extends Record<string, unknown> = Record<string, never>>(
  code: string,
  message: string,
  extra?: TExtra,
): { code: string; message: string } & TExtra {
  return {
    code,
    message,
    ...(extra ?? ({} as TExtra)),
  };
}

export function jsonError(code: string, message: string, status: number, traceId: string) {
  return Response.json(
    createApiErrorPayload(code, message),
    {
      status,
      headers: withTraceHeaders({}, traceId),
    },
  );
}

export type ApiDomainResult<TValue> =
  | { ok: true; value: TValue }
  | { ok: false; code: string; message: string };

export interface JsonResponder {
  json(payload: unknown, status?: number): Response;
}

export function resolveDomainErrorStatus(code: string): number {
  if (code === "FORBIDDEN") {
    return 403;
  }

  if (code === "UNAUTHORIZED") {
    return 401;
  }

  if (code === "NOT_FOUND") {
    return 404;
  }

  if (code === "CONFLICT") {
    return 409;
  }

  return 400;
}

export function respondDomainResult<TValue>(
  c: JsonResponder,
  result: ApiDomainResult<TValue>,
  traceId: string,
  options: {
    statusByCode?: (code: string) => number;
  } = {},
) {
  if (result.ok) {
    return c.json(result.value);
  }

  return jsonError(
    result.code,
    result.message,
    options.statusByCode?.(result.code) ?? resolveDomainErrorStatus(result.code),
    traceId,
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

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function parseSvgAssetId(assetName: string): string | null {
  return assetName.endsWith(".svg") ? assetName.slice(0, -4) : null;
}
