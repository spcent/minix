# MiniX v0.1 Backend Contract

## Goal

Freeze the minimum server contract before implementing auth and request services. `v0.1` assumes JSON request and response bodies.

## Frozen v1.0 Support Surface

The `v1.0` release supports four official sample apps:

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

The backend contract is therefore split into two practical layers:

- minimum shared host endpoints for the narrow learning flow
- richer official-sample endpoints used by the novel hosts

This document does not imply that every endpoint is required by every host. It freezes the server-facing surface that official `v1.0` samples are allowed to depend on.

## Endpoints

### `POST /auth/login`

Request:

```json
{
  "platform": "wechat",
  "credential": {
    "code": "temporary-platform-code"
  }
}
```

Response:

```json
{
  "userId": "u_123",
  "accessToken": "access-token",
  "refreshToken": "refresh-token",
  "expiresAt": 1760000000000,
  "profile": {
    "nickname": "MiniX User",
    "avatarUrl": "http://localhost:3000/sample-assets/profiles/minix-user.svg"
  }
}
```

### `POST /auth/logout`

This endpoint is optional for `v0.1`. If omitted, the client clears the local session only.

### `POST /auth/refresh`

Refreshes an expired access token using a valid refresh token.

Request:

```json
{
  "platform": "wechat",
  "refreshToken": "refresh-token"
}
```

Response:

```json
{
  "userId": "u_123",
  "accessToken": "next-access-token",
  "refreshToken": "next-refresh-token",
  "expiresAt": 1760003600000,
  "profile": {
    "nickname": "MiniX User",
    "avatarUrl": "http://localhost:3000/sample-assets/profiles/minix-user.svg"
  }
}
```

### `GET /me`

Returns the authenticated user summary used by the host app.

### `GET /items`

Returns list data for the first protected list page.

Suggested response shape:

```json
{
  "items": [
    {
      "id": "item_1",
      "title": "Example Item",
      "subtitle": "Protected resource",
      "categoryLabel": "Vocabulary",
      "difficultyLabel": "A2",
      "recommendedReason": "Start here to unlock the rest of today's plan.",
      "durationMinutes": 2
    }
  ],
  "page": 1,
  "pageSize": 20,
  "hasMore": false
}
```

## Auth Semantics

- `401` means unauthenticated or token expired
- `403` means authenticated but forbidden
- `429` means auth abuse controls blocked the request for the current client window
- `POST /auth/refresh` should return `401` when the refresh token is expired, revoked, or invalid
- `POST /auth/login` and `POST /auth/refresh` may return `429` with code `RATE_LIMITED`
- throttled auth responses should include `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`
- refresh tokens should be rotated on successful refresh; the previous refresh token becomes invalid immediately
- access token expiry must not implicitly revoke a still-valid refresh token
- explicit logout should revoke both the current access token and the paired refresh token when they are provided
- all failure bodies should include a stable error code when possible
- auth logs and counters must not include raw access tokens or refresh tokens

Suggested error response:

```json
{
  "code": "UNAUTHORIZED",
  "message": "Access token expired"
}
```

## Client Assumptions

- access token is sent through `Authorization: Bearer <token>`
- `Content-Type: application/json` is used for JSON bodies
- client generates a `x-trace-id` header for every request
- the server echoes the request trace id back through `X-Trace-Id`

## Novel Demo Endpoints

The standalone novel hosts build on the same auth semantics but use a richer content contract. These endpoints are currently mock-backed in the repo and should be treated as the official sample surface for future real backend work.

## Runtime Notes

- the current sample API uses opaque random access tokens and refresh tokens stored server-side, not self-describing JWTs
- production-oriented Worker deployments should bind `DB` to D1 for sessions and user state
- production-oriented Worker deployments should bind `AUTH_RATE_LIMIT_KV` to Cloudflare KV for login and refresh throttling
- auth throttling defaults to a `60` second window, `10` login attempts, and `20` refresh attempts unless the Worker env overrides:
  - `MINIX_AUTH_RATE_LIMIT_WINDOW_SECONDS`
  - `MINIX_AUTH_LOGIN_MAX_ATTEMPTS`
  - `MINIX_AUTH_REFRESH_MAX_ATTEMPTS`
- official sample media is served by the API itself under `/sample-assets/covers/:assetId.svg` and `/sample-assets/profiles/:assetId.svg`
- sample responses may return those media URLs as absolute URLs resolved against the current API origin

### `GET /novels`

Returns catalog or home feed cards.

Suggested response shape:

```json
{
  "items": [
    {
      "id": "novel_lantern",
      "slug": "lantern-under-vermilion-rain",
      "title": "Lantern Under Vermilion Rain",
      "authorName": "Lin Yue",
      "summary": "A court mystery with a slow-burn political romance.",
      "categoryKey": "mystery",
      "categoryLabel": "Mystery",
      "tags": [{ "key": "frontlist", "label": "Frontlist" }],
      "status": "serializing",
      "latestChapterId": "lantern_ch_18",
      "latestChapterTitle": "Chapter 18",
      "latestChapterOrder": 18,
      "continueChapterId": "lantern_ch_12",
      "continueChapterTitle": "Chapter 12",
      "recommendedReason": "Because you paused here last week.",
      "updatedAt": "2026-03-30T08:00:00.000Z",
      "wordCount": 182000,
      "readingCount": 8421,
      "bookshelfCount": 1380,
      "isFree": false,
      "isTrial": true,
      "requiresMembership": true,
      "isPurchased": false
    }
  ],
  "page": 1,
  "pageSize": 20,
  "hasMore": false
}
```

### `GET /novels/detail`

Returns a single title dossier for detail and membership intercept surfaces.

Relevant fields:

- core title metadata from `NovelDetail`
- current access signals: `isFree`, `isTrial`, `requiresMembership`, `isPurchased`, `inBookshelf`
- title reputation signals: `ratingScore`, `ratingCount`, `favoriteCount`
- reading service copy: `updateCadenceLabel`, `updateHistoryLabel`, `trialRuleLabel`, `accessRuleSummaryLabel`
- editorial framing: `authorPresenceLabel`, `relatedLaneLabel`
- navigation cues: `firstChapterId`, `continueChapterId`, `latestChapter`
- editorial discovery: `relatedNovels`

### `GET /chapters`

Returns the chapter directory for a title.

The response should be stable enough for:

- TOC rendering
- reader side-panel rendering
- locked or trial chapter state
- current and continue chapter highlighting
- current volume recovery and volume-level grouping

### `GET /chapters/content`

Returns the current chapter payload for the reader.

The response should include:

- title and body content
- access state such as `requiresMembership`, `isFree`, `isTrial`, `isPurchased`
- adjacent chapter ids for previous or next navigation when available

### `GET /reading-progress`

Loads the most recent saved chapter position for a title.

Relevant fields:

- `novelId`
- `chapterId`
- `chapterTitle`
- `progressPercent`
- `scrollOffset`
- `pageIndex`
- `updatedAt`

### `POST /reading-progress`

Persists the current reader position for resume flows across home, catalog, detail, TOC, and reader surfaces.

The client also uses saved chapter positions to keep recommendation lanes and TOC recovery state coherent after returning from the reader.

### `GET /bookshelf`

Returns current bookshelf titles. The client derives grouped lanes such as active, updated, and completed from the shared response plus saved reading progress, and can also apply reading-center shelf-order preferences on top of the shared response.

### `POST /bookshelf`

Adds a title to the bookshelf.

Suggested request:

```json
{
  "novelId": "novel_lantern"
}
```

### `DELETE /bookshelf`

Removes a title from the bookshelf.

Suggested request:

```json
{
  "novelId": "novel_lantern"
}
```

Both bookshelf mutations should return the next shelf snapshot plus title-level membership:

```json
{
  "novelId": "novel_lantern",
  "inBookshelf": true,
  "bookshelfCount": 1381,
  "items": []
}
```

### `GET /membership`

Returns the current membership overview for the requesting user.

Relevant fields:

- `active`
- `tier`: `guest | signed-in | member`
- `entitlementScope`: `none | chapter | title | membership`
- `statusLabel`
- `renewalLabel`
- `headline`
- `subheadline`
- `benefits`

### `POST /membership/purchase`

Performs a mock purchase and returns unlock context for the blocked route.

Suggested request:

```json
{
  "planId": "quarterly",
  "source": "reader",
  "novelId": "novel_lantern",
  "chapterId": "lantern_ch_12"
}
```

Suggested response:

```json
{
  "purchased": true,
  "overview": {
    "active": true,
    "tier": "member",
    "entitlementScope": "membership",
    "statusLabel": "Membership active",
    "renewalLabel": "Renews on 2026-07-01",
    "headline": "You now have full membership access.",
    "subheadline": "Return to the blocked chapter and continue reading.",
    "benefits": []
  },
  "source": "reader",
  "novelId": "novel_lantern",
  "chapterId": "lantern_ch_12",
  "returnTarget": "reader"
}
```

## Demo-Only Notes

- Storage keys such as `reader.display`, `reader.session`, and `novel.reading-center` are client-side runtime details, not backend contract fields.
- Page-level groupings like pinned bookshelf titles or derived recommendation lanes are currently computed client-side from the shared API payloads above.
