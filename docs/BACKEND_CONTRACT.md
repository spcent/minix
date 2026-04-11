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

Supported login methods are `wechat_code`, `guest`, `phone_code`, `password`, and `oauth`.

- `phone_code` must use a dynamic challenge issued by `POST /auth/verification-code/request`; static demo codes are no longer part of the default login path.
- `password` must match a stored hashed credential configured through `POST /auth/password/register` or `POST /auth/password/reset`.
- `oauth` must include a provider token, provider user id, and a valid state issued by `POST /auth/oauth/authorize`, or complete through `POST /auth/oauth/callback`.
- successful responses may include `riskDecision`, `credentialProtection`, and `abnormalLoginPrompt` in addition to the standard session output.

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

### `POST /auth/verification-code/request`

Issues a short-lived phone verification challenge for `login`, `guest_upgrade`, `phone_binding`, `change_phone`, or `password_reset`.

Response semantics:

- returns `verificationId`, masked phone number, expiry timestamp, retry interval, max attempts, and delivery metadata
- local/sample deployments use the built-in simulated SMS provider and may expose `delivery.debugCode` for automated tests
- consuming login and account flows must submit the returned code before it expires or before the attempt limit is exhausted

### `POST /auth/password/register`

Creates or replaces a hashed password credential for an account or phone subject.

Response semantics:

- returns the derived user id, normalized credential subject, and credential-protection metadata
- phone-based password registration must be paired with a `password_reset` verification challenge

### `POST /auth/password/reset`

Resets a phone-based password credential after a valid `password_reset` verification challenge.

### `POST /auth/oauth/authorize`

Creates a short-lived OAuth state record and returns a provider authorization URL.

### `POST /auth/oauth/callback`

Validates OAuth provider, state, provider token, and provider user id, persists the provider identity, and returns the authenticated session.

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

### `POST /auth/identity/upgrade`

Promotes a guest session into a formal account through phone verification or password credentials.

Request:

```json
{
  "credential": {
    "method": "phone_code",
    "phoneNumber": "13800000022",
    "verificationCode": "code-from-/auth/verification-code/request"
  },
  "redirectTarget": {
    "path": "/items",
    "source": "account"
  }
}
```

Response semantics:

- returns a normal authenticated session with `identityWorkflow.status = "completed"` when the guest upgrade succeeds
- returns the current guest session with `identityWorkflow.status = "merge_required"` when the verified identity already belongs to another account
- returns the current session with `identityWorkflow.status = "blocked"` for explicit workflow failures such as invalid verification code
- `identityWorkflow.workflowId`, `stage`, `mergePreview`, and `audit` are present when a workflow needs preview, confirmation, completion, or rollback-safe recovery evidence

### `POST /auth/identity/bind-phone`

Binds a verified phone number to the current WeChat-backed session.

The merge-required branch returns a preview of source and target uploaded assets, message history, feedback tickets, managed content, and relationship impact before account data is moved.

### `POST /auth/identity/merge`

Confirms or cancels a pending merge and returns a user-visible identity workflow state.

- `confirm: true` completes the merge, revokes the source session, issues a target account session, and appends `merge_confirmed` and `merge_completed` audit records.
- `confirm: false` leaves source and target account data unchanged, returns `identityWorkflow.status = "blocked"`, and appends `merge_blocked` plus `rollback_safe_failure` audit records.
- target mismatches return a blocked workflow with `failureReason = "merge_target_mismatch"` instead of mutating either account.

### `POST /orders/cancel`

Cancels a pending order before payment completion.

### `POST /orders/refund`

Moves a paid order into the refund flow and returns the updated order detail.

### `POST /payments/callback`

Applies a payment provider callback outcome to an order and records callback verification metadata.

- `providerMode = "sample"` keeps the local mock behavior explicit and accepts the legacy `verified` field for tests and demos.
- `providerMode = "production"` requires `callbackReference`, `nonce`, `timestamp`, and an HMAC-SHA256 `signature` over order id, outcome, callback reference, nonce, timestamp, and gateway transaction id.
- stale callbacks, missing signatures, signature mismatches, and replayed callback references or nonces are rejected and recorded in `callbackLedger`.
- successful callbacks append `paymentLedger`, `operationLedger`, and callback verification records with gateway references.

### `POST /payments/reconcile`

Reconciles stored order state against stored payment state and returns reconciliation metadata.

### `POST /uploads`

Compatibility endpoint that accepts a platform-selected upload payload and runs the full sample session, chunk, and completion flow in one request.

### `POST /uploads/session`

Creates a durable upload session, object key, checksum contract, and resumable chunk manifest from the selected asset metadata plus transfer payload.

### `POST /uploads/chunk`

Transfers one chunk into the sample object-storage lane, verifies checksum and byte-range metadata, and updates durable progress state.

### `POST /uploads/complete`

Verifies the assembled file checksum, finalizes the durable asset reference, and returns review plus cleanup metadata.

### `POST /uploads/attach`

Backfills the finalized asset into a business owner reference such as `feedback`, `content`, or `avatar`.

The current sample pipeline intentionally splits responsibility:

- platform adapters only choose media or files and may supply transfer payloads
- the backend owns session creation, chunk verification, checksum validation, review status, cleanup state, and resource binding

### `POST /uploads/retry`

Retries a previously failed or cancelled upload task and returns a refreshed resumable upload session state.

### `POST /uploads/cancel`

Cancels a backend-backed upload task and moves it into scheduled cleanup semantics.

### `POST /share/prepare`

Normalizes a share payload into a landing target, short-link placeholder, and backend-backed attribution record before dispatch.

### `POST /share/return`

Recognizes a share landing or conversion and updates the stored attribution counters plus return-flow metadata.

### `GET /messages/thread`

Returns a conversation-capable message thread including:

- `messageThread` summary
- `messageItems` for the thread body list
- `detailActions` describing bounded reply and read behavior
- `unreadBadge`

### `POST /messages/thread/read`

Marks a thread as read and updates the thread-level unread counters.

### `POST /messages/thread/send`

Appends an outbound message into a bounded sample conversation surface for private, consultation, and customer-service threads.

### `POST /account/profile`

Updates bounded profile fields on the current account and returns the refreshed normalized account-operation surface.

### `POST /account/change-phone`

Updates the currently bound phone number after a valid `change_phone` verification challenge and returns the refreshed normalized account-operation surface.

### `POST /account/unbind`

Removes the WeChat binding from the current sample account when the operation is available.

### `POST /account/cancellation`

Marks the account as `cancellation_pending` and returns the refreshed normalized account-operation surface.

### `POST /account/relations`

Applies bounded relation actions for the current sample relation target.

Supported sample actions:

- `follow`
- `unfollow`
- `block`
- `unblock`
- `set_remark`
- `clear_remark`

### `GET /content/detail`

Returns a bounded generic content detail payload on top of the shared `contentDetail` and `contentAccess` contracts.

### `POST /content/lifecycle`

Applies a bounded lifecycle transition on generic managed content.

Supported sample actions:

- `publish`
- `update`
- `archive`
- `delete`
- `restore`
- `submit_review`
- `approve_review`
- `reject_review`
- `change_visibility`

### `GET /feed`

Still backs the official feed surface, but now also acts as the bounded shared search-center orchestration for:

- `mode=global`
- `mode=content`
- `mode=user`
- `mode=domain`

Supported sample domains:

- `feed`
- `content`
- `novel`
- `user`
- `all`

The normalized `searchResults` payload now carries `domainTabs` and `resultGroups` for cross-domain composition.

### `GET /me`

Returns the authenticated user summary used by the host app.

The normalized response includes:

- `userProfile`
- `accountSummary`
- `userStatus`
- `identityWorkflows`
- `accountOperations`
- `relationTargets`

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

### `GET /feedback/bootstrap`

Returns the shared feedback intake surface plus the current bounded service-loop handoff.

The normalized response may include:

- `feedbackCategories`
- `recommendedFaqEntries`
- `supportEntry`
- `serviceLoopSummary`
- `latestTicket`
- `latestStatus`
- `latestCategory`

### `POST /feedback`

Creates a feedback ticket using the shared feedback form payload and returns:

- `feedbackTicket`
- `feedbackCategory`
- `feedbackStatus`

`feedbackStatus` now carries FAQ recommendations, a bounded support entry, revisit semantics, and processing history so the client does not invent a separate support model.

### `POST /feedback/ticket/revisit`

Reopens or advances an existing ticket inside the same shared support loop.

Request:

```json
{
  "ticketId": "fb_123",
  "userMessage": "Please re-check after I cleared local cache."
}
```

Response semantics:

- returns the same `feedbackTicket / feedbackCategory / feedbackStatus` shape as `POST /feedback`
- may append user follow-up history and move the ticket back into `triaged` or `in_progress`
- may relay the follow-up into the reserved customer-service thread used by the sample inbox

## Auth Semantics

- `401` means unauthenticated or token expired
- `403` means authenticated but forbidden
- `429` means auth abuse controls blocked the request for the current client window
- `POST /auth/refresh` should return `401` when the refresh token is expired, revoked, or invalid
- `POST /auth/login` and `POST /auth/refresh` may return `429` with code `RATE_LIMITED`
- `POST /auth/login` no longer validates static demo phone codes or static demo passwords by default; phone-code login uses stored verification challenges and password login uses hashed stored credentials
- OAuth login/callback rejects missing, expired, or mismatched state with `credentialProtection.failureReason = "oauth_state_invalid"`
- identity workflow endpoints should use `identityWorkflow.status` for merge-required or blocked business outcomes instead of forcing every branch through transport errors
- payment endpoints should return `callbackVerification`, `reconciliation`, and optional `operationResult` as part of the order detail surface when transaction operations mutate state
- upload endpoints should return backend-backed lifecycle, checksum, review, cleanup, and reference-binding fields so consuming features do not invent their own moderation or storage semantics
- share endpoints should preserve attribution ids, landing targets, and auth-aligned return targets so growth flows do not invent a parallel redirect model
- message endpoints should keep notification lists, thread summaries, and thread bodies as distinct but aligned outputs
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

The novel endpoints now expose two layers at once:

- a generic content layer through `contentCard`, `contentDetail`, and `contentAccess`
- a novel-specific extension layer through chapter, reading-progress, and serialized-reading fields

Future content products should reuse the generic layer instead of treating the novel sample as the only content model.

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
- upload selection remains adapter-only, but upload lifecycle state is now sample-backed through `/uploads/session`, `/uploads/chunk`, `/uploads/complete`, `/uploads/attach`, `/uploads/retry`, and `/uploads/cancel`
- share dispatch remains adapter-backed, but landing-target normalization and attribution persistence are now sample-backed through `/share/prepare` and `/share/return`
- notification browsing remains sample-backed through `/notifications`, while conversation-capable message flows now extend through `/messages/thread`, `/messages/thread/read`, and `/messages/thread/send`

### `GET /novels`

Returns catalog or home feed cards.

Each item should also expose:

- `contentCard` for shared content model, display, lifecycle, and recommendation-slot semantics
- `contentAccess` for shared public/login/member/purchased visibility semantics

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

The detail response should also expose:

- `contentDetail` for shared content model, display, and lifecycle semantics
- `contentAccess` for shared access and entitlement semantics

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

Creates a membership order and returns unlock context plus host-executable payment parameters.

Use `providerMode = "sample"` for local mock payment behavior. Use `providerMode = "production"` with `wechat_pay` or `h5_pay` to receive gateway references, signed client parameters, and durable payment ledger records.

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
