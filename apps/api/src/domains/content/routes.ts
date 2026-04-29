import type {
  BookshelfMutationResponse,
  ContentDetailResponse,
  ContentLifecycleMutationResponse,
  ContentReviewQueueResponse,
  ListContentReviewQueueRequest,
  LoadReadingProgressResponse,
  SaveContentDraftRequest,
  SaveContentDraftResponse,
} from "@minix/contracts";

import {
  createBookshelf,
  listNovels,
  resolveChapterContent,
  resolveChapterList,
  resolveNovelDetail,
} from "./novels";
import {
  getManagedContentDetail,
  listManagedContentReviewQueue,
  saveManagedContentDraft,
  applyManagedContentLifecycle,
} from "./managed-content";
import { listFeed } from "./feed";
import { CHAPTER_CONTENT, CHAPTER_LISTS, NOVELS } from "../../content";
import {
  getRouteTraceId,
  parseRouteBody,
  parseRouteQuery,
  withParsedRouteBody,
  withRouteUserState,
  withRouteUserStateMutation,
} from "../../http/route-context";
import { jsonError, respondDomainResult } from "../../http/response";
import type { ApiRouteBaseOptions } from "../route-options";
import { pickDefinedApiFields } from "../schema-helpers";
import {
  bookshelfMutationSchema,
  chapterIdQuerySchema,
  contentDraftSaveSchema,
  contentIdQuerySchema,
  contentLifecycleMutationSchema,
  contentReviewQueueQuerySchema,
  feedQuerySchema,
  novelIdQuerySchema,
  novelsQuerySchema,
  saveReadingProgressSchema,
} from "./schemas";

export interface RegisterContentRoutesOptions extends ApiRouteBaseOptions {}

export function registerContentRoutes(options: RegisterContentRoutesOptions) {
  const { app, requireSession, resolveStore } = options;

  app.use("/feed", requireSession);
  app.use("/content", requireSession);
  app.use("/content/*", requireSession);
  app.use("/novels", requireSession);
  app.use("/novels/*", requireSession);
  app.use("/chapters", requireSession);
  app.use("/chapters/*", requireSession);
  app.use("/bookshelf", requireSession);
  app.use("/reading-progress", requireSession);

  app.get("/feed", async (c) => {
    const query = parseRouteQuery(c, feedQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    return withRouteUserState(c, resolveStore, ({ userState }) => c.json(listFeed(query, userState)));
  });

  app.get("/content/detail", async (c) => {
    const query = parseRouteQuery(c, contentIdQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const traceId = getRouteTraceId(c);
    return withRouteUserState(c, resolveStore, ({ userState }) => {
      const response = getManagedContentDetail(
        {
          contentId: query.contentId,
          ...pickDefinedApiFields(query, ["actorRole"]),
        },
        userState,
      );
      if (!response) {
        return jsonError("NOT_FOUND", "Managed content not found.", 404, traceId);
      }

      return c.json(response satisfies ContentDetailResponse);
    });
  });

  app.get("/content/review-queue", async (c) => {
    const query = parseRouteQuery(c, contentReviewQueueQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const request: ListContentReviewQueueRequest = pickDefinedApiFields(query, [
      "page",
      "pageSize",
      "state",
      "actorRole",
    ]);
    return withRouteUserState(c, resolveStore, ({ userState }) =>
      c.json(listManagedContentReviewQueue(userState, request) satisfies ContentReviewQueueResponse),
    );
  });

  app.post("/content/save-draft", async (c) => {
    const traceId = getRouteTraceId(c);
    return withParsedRouteBody(c, contentDraftSaveSchema, (payload) =>
      withRouteUserStateMutation(c, resolveStore, ({ userState }) => {
      const request: SaveContentDraftRequest = {
        model: payload.model,
        title: payload.title,
        summary: payload.summary,
        visibility: payload.visibility,
        categoryKey: payload.categoryKey,
        categoryLabel: payload.categoryLabel,
        tags: payload.tags,
        ...pickDefinedApiFields(payload, [
          "contentId",
          "subtitle",
          "bodyPreview",
          "coverAssetId",
          "attachmentAssetIds",
          "actorRole",
        ]),
      };
      const response = saveManagedContentDraft(userState, request);
      if (!response.ok) {
        return respondDomainResult(c, response, traceId);
      }

      return c.json(response.value satisfies SaveContentDraftResponse);
      }),
    );
  });

  app.post("/content/lifecycle", async (c) => {
    const traceId = getRouteTraceId(c);
    return withParsedRouteBody(c, contentLifecycleMutationSchema, (payload) =>
      withRouteUserStateMutation(c, resolveStore, ({ userState }) => {
      const response = applyManagedContentLifecycle(userState, {
        contentId: payload.contentId,
        action: payload.action,
        ...pickDefinedApiFields(payload, ["visibility", "reviewMessage", "actorRole"]),
      });
      if (!response.ok) {
        return respondDomainResult(c, response, traceId);
      }

      return c.json(response.value satisfies ContentLifecycleMutationResponse);
      }),
    );
  });

  app.get("/novels", async (c) => {
    const query = parseRouteQuery(c, novelsQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const membershipActive = Boolean(userState.membershipPlanId);
    return c.json(listNovels(query, membershipActive, userState, c.req.url));
  });

  app.get("/novels/detail", async (c) => {
    const traceId = getRouteTraceId(c);
    const query = parseRouteQuery(c, novelIdQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const detail = NOVELS.find((item) => item.id === query.novelId);
    if (!detail) {
      return jsonError("NOT_FOUND", "Novel not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    return c.json(resolveNovelDetail(detail, Boolean(userState.membershipPlanId), userState.bookshelfNovelIds, c.req.url));
  });

  app.get("/chapters", async (c) => {
    const traceId = getRouteTraceId(c);
    const query = parseRouteQuery(c, novelIdQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const response = CHAPTER_LISTS[query.novelId];
    if (!response) {
      return jsonError("NOT_FOUND", "Chapter list not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    return c.json(resolveChapterList(response, Boolean(userState.membershipPlanId)));
  });

  app.get("/chapters/content", async (c) => {
    const traceId = getRouteTraceId(c);
    const query = parseRouteQuery(c, chapterIdQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const response = CHAPTER_CONTENT[query.chapterId];
    if (!response) {
      return jsonError("NOT_FOUND", "Chapter content not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    return c.json(resolveChapterContent(response, Boolean(userState.membershipPlanId)));
  });

  app.get("/bookshelf", async (c) => {
    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    return c.json(createBookshelf(userState, Boolean(userState.membershipPlanId), c.req.url));
  });

  app.post("/bookshelf", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, bookshelfMutationSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const detail = NOVELS.find((item) => item.id === payload.novelId);
    if (!detail) {
      return jsonError("NOT_FOUND", "Novel not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    userState.bookshelfNovelIds.add(payload.novelId);
    await store.saveUserState(session.userId, userState);
    const updatedDetail = resolveNovelDetail(detail, Boolean(userState.membershipPlanId), userState.bookshelfNovelIds);

    const response: BookshelfMutationResponse = {
      novelId: payload.novelId,
      inBookshelf: true,
      bookshelfCount: updatedDetail.bookshelfCount ?? 0,
      items: createBookshelf(userState, Boolean(userState.membershipPlanId)).items,
    };

    return c.json(response);
  });

  app.delete("/bookshelf", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, bookshelfMutationSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const detail = NOVELS.find((item) => item.id === payload.novelId);
    if (!detail) {
      return jsonError("NOT_FOUND", "Novel not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    userState.bookshelfNovelIds.delete(payload.novelId);
    await store.saveUserState(session.userId, userState);
    const updatedDetail = resolveNovelDetail(detail, Boolean(userState.membershipPlanId), userState.bookshelfNovelIds);

    const response: BookshelfMutationResponse = {
      novelId: payload.novelId,
      inBookshelf: false,
      bookshelfCount: updatedDetail.bookshelfCount ?? 0,
      items: createBookshelf(userState, Boolean(userState.membershipPlanId)).items,
    };

    return c.json(response);
  });

  app.get("/reading-progress", async (c) => {
    const query = parseRouteQuery(c, novelIdQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const response: LoadReadingProgressResponse = {
      progress: userState.progressByNovelId[query.novelId] ?? null,
    };
    return c.json(response);
  });

  app.post("/reading-progress", async (c) => {
    const payload = await parseRouteBody(c, saveReadingProgressSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const chapter = CHAPTER_CONTENT[payload.chapterId];
    const updatedAt = new Date().toISOString();
    userState.progressByNovelId[payload.novelId] = {
      novelId: payload.novelId,
      chapterId: payload.chapterId,
      progressPercent: payload.progressPercent,
      updatedAt,
      ...pickDefinedApiFields(payload, ["scrollOffset", "pageIndex"]),
      ...pickDefinedApiFields({ chapterTitle: chapter?.title }, ["chapterTitle"]),
    };
    await store.saveUserState(session.userId, userState);
    return c.json({
      saved: true,
      progress: {
        ...payload,
        updatedAt,
      },
    });
  });
}
