import { renderSampleCoverAssetSvg, renderSampleProfileAssetSvg, renderSharePosterSvg } from "../../sample-assets";
import { getRouteTraceId } from "../../http/route-context";
import { createSvgResponse, jsonError, parseSvgAssetId } from "../../http/response";
import type { ApiRouteAppOptions } from "../route-options";

export interface RegisterPublicRoutesOptions extends ApiRouteAppOptions {}

export function registerPublicRoutes(options: RegisterPublicRoutesOptions) {
  const { app } = options;

  app.get("/", (c) =>
    c.json({
      service: "minix-api",
      status: "ok",
      version: "1.0.0",
    }),
  );

  app.get("/sample-assets/covers/:assetName", (c) => {
    const traceId = getRouteTraceId(c);
    const assetId = parseSvgAssetId(c.req.param("assetName"));
    if (!assetId) {
      return jsonError("NOT_FOUND", "Sample cover asset not found.", 404, traceId);
    }

    const svg = renderSampleCoverAssetSvg(assetId);
    if (!svg) {
      return jsonError("NOT_FOUND", "Sample cover asset not found.", 404, traceId);
    }

    return createSvgResponse(svg, traceId);
  });

  app.get("/sample-assets/profiles/:assetName", (c) => {
    const traceId = getRouteTraceId(c);
    const assetId = parseSvgAssetId(c.req.param("assetName"));
    if (!assetId) {
      return jsonError("NOT_FOUND", "Sample profile asset not found.", 404, traceId);
    }

    const svg = renderSampleProfileAssetSvg(assetId);
    if (!svg) {
      return jsonError("NOT_FOUND", "Sample profile asset not found.", 404, traceId);
    }

    return createSvgResponse(svg, traceId);
  });

  app.get("/share-posters/:shortCode.svg", (c) => {
    const traceId = getRouteTraceId(c);
    const svg = renderSharePosterSvg({
      title: "MiniX Share Poster",
      summary: "Open the short link to continue into the attributed share flow.",
      shortCode: c.req.param("shortCode") ?? "share",
      channelLabel: "Poster",
    });

    return createSvgResponse(svg, traceId);
  });
}
