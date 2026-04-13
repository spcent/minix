# MiniX v1.0 Backend Contract

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

## Shared Page State Baseline

Feature controllers consuming shared list/detail protocols should normalize business state into the common page status surface instead of inventing feature-local flags.

- `ListStatus` now covers `loading`, `refreshing`, `appending`, `empty`, `error`, `partial`, and `skeleton`, plus `staleData`, retry capability, and route-recovery metadata through `restoredQueryKeys` and `restoredSelectionId`.
- `DetailStatus` now covers `ready`, `stale`, `deleted`, `forbidden`, `offline`, `unavailable`, `unpublished`, and deep-link recovery via `recoveredFromLink` and `requestedDetailId`.
- Official sample adoptions in `v1.0` include items progress lists, feed/search lists, inbox notification lists, novel detail pages, message-thread detail states, subscription commerce detail states, account operation forms, feedback forms, and managed-content draft forms.
- Inbox notification and thread-detail consumers now include all four sample hosts, and they intentionally expose `MessageSyncState.mode = "polling"` rather than implying an unimplemented realtime transport.
- Explicit exceptions in `v1.0` are also part of the contract posture:
  - auth login and identity handoff remain provider-aware credential workflows instead of generic `FormPageState` flows
  - reader remains an immersive chapter runtime instead of a shared `DetailPageState`
  - subscription order history remains an embedded list collection inside the commerce center instead of a standalone `ListPageState`

## Platform Capability Baseline

Platform capability adapters must return normalized capability status metadata before feature controllers attempt execution.

- `CapabilityStatus` now reports `available`, `mode = native | degraded | unavailable`, `detail`, `reason`, and optional `fallbackActionLabel`.
- `CapabilityActionResult` may report degraded execution with fallback guidance when the host substitutes clipboard copy or another non-primary path.
- H5 baseline:
  - `clipboard`, `device`, and `location` execute through browser APIs when available
  - `share` prefers `navigator.share` and degrades to clipboard copy when only clipboard is available
  - `upload` uses a configured upload runtime or falls back to the browser file picker
  - `payment` requires an injected H5 payment runtime and otherwise reports an unavailable capability state
- WeChat baseline:
  - `clipboard`, `device`, `location`, `payment`, and `upload` execute through runtime `wx` bridges when available
  - `share` prefers `showShareMenu` and degrades to clipboard copy when only clipboard is available

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

- official H5 hosts use the built-in `guest` path as the primary Home sign-in action unless a host injects another credential provider explicitly
- official WeChat hosts use `wx.login` and submit the returned platform code through `wechat_code`
- `phone_code` must use a dynamic challenge issued by `POST /auth/verification-code/request`; static demo codes are no longer part of the default login path.
- `password` must match a stored hashed credential configured through `POST /auth/password/register` or `POST /auth/password/reset`.
- `oauth` must include a provider token, provider user id, and a valid state issued by `POST /auth/oauth/authorize`, or complete through `POST /auth/oauth/callback`.
- successful responses may include `riskDecision`, `deviceIdentity`, `rateLimitState`, `securityAuditEvents`, `credentialProtection`, and `abnormalLoginPrompt` in addition to the standard session output.

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

The refresh response shape matches `POST /auth/login`, including optional `rateLimitState` and `securityAuditEvents` fields when the sample security baseline is active.

### `POST /auth/verification-code/request`

Issues a short-lived phone verification challenge for `login`, `guest_upgrade`, `phone_binding`, `change_phone`, `password_reset`, or `account_security`.

Response semantics:

- returns `verificationId`, masked phone number, expiry timestamp, retry interval, max attempts, and delivery metadata
- `account_security` challenges are attached to the current signed-in account when an access token is present so high-risk account operations can verify the existing owner
- `delivery.providerMode = "sample" | "production"` makes the current SMS backing explicit to the host
- local/sample deployments use the built-in simulated SMS provider and may expose `delivery.debugCode` for automated tests
- consuming login and account flows must submit the returned code before it expires or before the attempt limit is exhausted
- responses may also carry `riskDecision`, `deviceIdentity`, `rateLimitState`, and recent `securityAuditEvents`

### `POST /auth/password/register`

Creates or replaces a hashed password credential for an account or phone subject.

Response semantics:

- returns the derived user id, normalized credential subject, and credential-protection metadata
- phone-based password registration must be paired with a `password_reset` verification challenge

### `POST /auth/password/reset`

Resets a phone-based password credential after a valid `password_reset` verification challenge.

### `POST /auth/oauth/authorize`

Creates a short-lived OAuth state record and returns a provider authorization URL.

- accepts `purpose = login | bind`; `bind` states are bound to the current authenticated session when an access token is present
- returns the normalized provider state, provider label, provider mode, expiry, and authorization URL that the client must preserve through callback or bind completion
- the repo keeps `providerMode = "sample"` explicit until operator-owned production callback domains and provider credentials are configured

### `POST /auth/oauth/callback`

Validates OAuth provider, state, provider token, and provider user id, persists the provider identity, and returns the authenticated session.

### `POST /auth/identity/bind-oauth`

Links a third-party provider identity to the current authenticated account.

- requires a valid OAuth state from `POST /auth/oauth/authorize` with `purpose = bind`
- persists provider identities into `accountSummary.providerIdentities`
- returns `identityWorkflow.kind = oauth_binding`
- when the provider is already linked elsewhere, returns `identityWorkflow.status = merge_required` with merge-preview guidance instead of silently reassigning the identity

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

### `GET /orders/catalog`

Returns the shared product and SKU catalog used by membership packages, one-time virtual goods, subscription products, and value-added services.

### `POST /orders/purchase`

Creates a generic SKU-backed order and returns the normalized order, SKU, payment, entitlement, and optional subscription state.

### `GET /orders/list`

Returns a paginated order list with optional `status` and `productType` filters.

### `POST /orders/cancel`

Cancels a pending order before payment completion.

### `POST /orders/refund`

Moves a paid order into the refund flow and returns the updated order detail.

### `GET /subscriptions`

Returns the active subscription and membership-renewal records derived from the current order history.

### `POST /subscriptions/cancel`

Disables auto-renew for the selected subscription while preserving access for the current paid term.

### `POST /subscriptions/renew`

Creates the next paid term for an existing subscription and returns the renewed order plus subscription state.

### `GET /after-sales/list`

Returns the durable after-sales cases created by order cancellation and refund flows.

### `GET /after-sales/detail`

Returns one after-sales case plus the related order and latest operation result.

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

The sample implementation also appends upload-scope security audit events and upload rate-limit state into the authenticated account security center.

Official media-tools hosts surface the current review/storage posture directly from returned upload metadata so `sample-upload-policy` remains explicit in UX until a production backend is configured.

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

Normalizes a share payload into a landing target, durable short-link record, optional poster asset url, and backend-backed attribution record before dispatch.

The sample implementation also appends share-scope security audit events and share rate-limit state into the authenticated account security center.

Official media-tools hosts surface the current share-provider posture directly from returned report metadata so sample-backed poster generation and host-native channel fallback remain explicit in UX.

Returned share-specific additions:

- `landingTarget.shortCode`
- `shortLinkRecord`
- `posterAsset` for `scenario = "poster"` or `shareChannel.kind = "poster_image"`
- `attributionReport`

### `GET /share/resolve`

Resolves a prepared short link by `shortCode` or `attributionId` and increments the click-side attribution counters.

### `POST /share/return`

Recognizes a share landing or conversion and updates stored return/conversion counters plus invite-binding metadata.

### `GET /share/report`

Returns the latest attribution report for a prepared share, including:

- share count
- click count
- return count
- conversion count
- resolved short-link metrics
- poster asset metadata when the share prepared a poster channel

### `GET /messages/threads`

Returns the durable conversation list with unread sorting, type filtering, and polling sync metadata.

- `messageThread.syncState.mode` is currently fixed to `polling`
- `modeLabel`, `statusLabel`, and `providerSummary` make the polling-first delivery posture explicit for host UX instead of implying a real-time transport

### `GET /messages/thread`

Returns a conversation-capable message thread including:

- `messageThread` summary
- `messageItems` for the thread body list
- `detailActions` describing bounded reply and read behavior
- `unreadBadge`
- optional `threadList` and `changed` flags for polling-based sync recovery

### `POST /messages/thread/create`

Creates a durable private, consultation, customer-service, or group thread and returns the refreshed thread list.

The sample implementation also appends message-scope security audit events and message rate-limit state into the authenticated account security center.

### `POST /messages/thread/read`

Marks a thread as read and updates the thread-level unread counters.

### `POST /messages/thread/send`

Appends an outbound message into a bounded sample conversation surface for private, consultation, and customer-service threads.

- outbound delivery is polling-backed and progresses through `pending`, `delivered`, or `failed`
- each external touchpoint returns provider metadata, template selection, delivery receipt state, retryability, and unsubscribe hints alongside the in-app fallback touchpoint
- when `providerMode = "sample"`, status labels and failure messages stay explicit that delivery is sample-backed and finalized through polling sync rather than a live provider callback
- user notification-channel preferences are enforced before dispatch; opted-out or disabled channels return `opted_out` or `skipped` receipts while in-app delivery remains available
- the same centralized security audit and rate-limit baseline used by thread creation also applies here
- group reply permissions are enforced by `replyPolicy`, `members`, and `groupState`
- consultation and customer-service threads expose assignment plus progress metadata in the same response surface

### `POST /messages/thread/retry`

Retries a failed outbound message and returns the refreshed thread detail plus unread aggregate.

- failed external touchpoints move back to `sent`, increment their retry counters, and remain polling-backed until sync finalizes provider receipts
- retry labels remain explicit that sample-backed receipts will not settle until the next polling cycle

### `GET /messages/thread/sync`

Polling endpoint that accepts the last seen cursor and returns `changed = false` when the durable thread state is unchanged.

- successful polling also advances queued or sent external delivery receipts to `delivered` in the sample provider model
- there is no real-time transport in the current official-sample message surface; host UX should treat polling as the only synchronization contract

### `GET /settings`

Returns the normalized settings center payload for the authenticated account.

The response includes:

- `preferences`
- `featureToggles`
- `privacyOptions`
- `effectivePolicy`
- `notificationChannels`
- `lockedSettingKeys`

`effectivePolicy` is the backend-resolved behavior surface that downstream features should consume instead of re-deriving local rules.

`notificationChannels` exposes the per-channel delivery policy for `subscription_message`, `sms`, `email`, and `push`, including enablement, unsubscribe state, provider labeling, locale, and whether in-app fallback stays active.

### `POST /settings`

Persists a partial `UpdateSettingsRequest` into the authenticated account state and returns the refreshed normalized settings payload.

Supported sample semantics:

- notification preferences and channel toggles update touchpoint eligibility for notification and message delivery
- `notificationChannels` accepts per-channel enable and unsubscribe mutations without changing the shared route shape
- privacy preferences update profile discovery exposure, relation search exposure, and personalization flags used by feed and user-search results
- device preferences update autoplay policy, weak-network behavior, and upload chunk sizing for resumable uploads
- developer options are environment-scoped; production bindings return locked developer controls through `effectivePolicy.developer` and `lockedSettingKeys`
- persisted settings survive session refresh and later session restoration because they are stored with the account state

### `POST /account/profile`

Updates bounded profile fields on the current account and returns the refreshed normalized account-operation surface.

### `POST /account/change-phone`

Updates the currently bound phone number after a valid `change_phone` verification challenge and returns the refreshed normalized account-operation surface.

- requires `riskConfirmed = true`
- requires `securityVerificationCode` when the account already has a verified phone
- appends an `operationRecord` and starts a short change cooldown in the sample state
- updates `securityCenter` with account-scope audit events and the latest account-operation rate-limit state

### `POST /account/unbind`

Removes the WeChat binding from the current sample account when the operation is available.

- requires `riskConfirmed = true`
- requires an `account_security` verification code from the currently bound phone
- requires another fallback credential to remain available
- appends an `operationRecord` and starts a short unbind cooldown in the sample state
- updates `securityCenter` with account-scope audit events and the latest account-operation rate-limit state

### `POST /account/provider/unlink`

Removes a linked OAuth provider identity from the current account when another login method remains available.

- requires `provider`, `providerUserId`, `riskConfirmed = true`, and an `account_security` verification code
- rejects the operation when unlinking would leave the account without any usable login method
- marks the provider identity as `authorizationStatus = unlinked`, appends an `operationRecord`, and emits account-scope security audit state

### `POST /account/provider/revoke`

Revokes the current account's authorization for a linked OAuth provider without deleting its identity record.

- requires `provider`, `providerUserId`, `riskConfirmed = true`, and an `account_security` verification code
- rejects the operation when revoking would leave the account without any usable login method
- marks the provider identity as `authorizationStatus = revoked`, preserves the linked provider record for later reauthorization, appends an `operationRecord`, and emits account-scope security audit state

### `POST /account/cancellation`

Handles both cancellation request and cancellation revoke through `action = request | revoke`.

- request mode requires `riskConfirmed = true` and an `account_security` verification code
- request mode moves the account into `cancellation_pending`, sets `cancellationRequestedAt` / `cancellationEffectiveAt` / `cancellationRevocableUntil`, and appends an `operationRecord`
- revoke mode clears the pending cancellation during the cooling-off window and appends an `operationRecord`
- both request and revoke flows update `securityCenter` with account-scope audit events and the latest account-operation rate-limit state

### `POST /account/relations`

Applies bounded relation actions for the current sample relation target.

Supported sample actions:

- `follow`
- `unfollow`
- `block`
- `unblock`
- `set_remark`
- `clear_remark`

Additional sample semantics:

- accepts optional `listKind`, `page`, `pageSize`, and `keyword` so relation list surfaces can refresh after a mutation without a second round-trip
- relation targets now expose explicit `friendState` values such as `mutual`, `incoming_request`, and `outgoing_request`

### `GET /account/relations/list`

Returns a paginated relationship list for one of:

- `following`
- `followers`
- `friends`
- `blocked`
- `remarks`

Additional sample semantics:

- supports `page`, `pageSize`, and `keyword`
- each list item reuses the shared relation action surface and includes explicit mutual or pending friend semantics

### `GET /account/assets/history`

Returns append-only asset ledger history for the authenticated account.

Additional sample semantics:

- supports `page`, `pageSize`, and `subject = all | points | level | balance | membership | entitlement`
- ledger entries expose balance delta, frozen-balance delta, points delta, membership plan id, and optional entitlement snapshots
- `accountSummary.assets` is derived from ledger state rather than placeholder values and now includes `availableBalanceCents`, `frozenBalanceCents`, and `activeEntitlements`
- sample payment, callback, cancellation, and refund flows append asset ledger entries instead of mutating balances in place

### `GET /content/detail`

Returns a bounded generic content detail payload on top of the shared `contentDetail` and `contentAccess` contracts.

- supports `actorRole` to expose author, reviewer, admin, or reader permissions in the sample CMS
- detail payload may include authoring data, attachment references, review record, permissions, and audit history

### `GET /content/review-queue`

Returns the sample review queue for `under_review` managed content, including attachment counts and reviewer assignment labels.

### `POST /content/save-draft`

Creates or updates a managed content draft, binds uploaded cover/attachment asset references, and appends audit history.

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

Additional sample semantics:

- lifecycle requests may include `actorRole` so role-specific permissions can be exercised in shared feature tests
- reviewer and admin roles can approve, reject, archive, and restore
- author and admin roles can save drafts, submit review, and change visibility
- reader access is denied for non-published content even when a draft or review detail payload is available to privileged roles

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

Additional sample semantics:

- `searchQuery.sortKey` preserves route-restorable sort state for the shared search center
- `searchResults` may include `correctionKeyword`, `correctionReason`, and `recoverySuggestions` when the current query looks like a typo or returns no results
- `searchResults.ranking` exposes the applied ranking strategy so clients do not re-derive sorting rules locally
- user and other cross-domain search items may expose `routeTarget` so the client can jump to the bounded destination without hand-written route maps
- hot terms, recent history, suggestions, filter state, and sort state are all carried in the same normalized response surface

### `GET /me`

Returns the authenticated user summary used by the host app.

The normalized response includes:

- `userProfile`
- `accountSummary`
- `userStatus`
- `identityWorkflows`
- `securityCenter`
- `accountOperations`
- `operationRecords`
- `relationTargets`

`securityCenter` carries:

- `deviceIdentities`
- `auditEvents`
- `latestRateLimit`
- `latestPrompt`

`accountSummary.assets` now includes:

- `points`
- `level`
- `membership`
- `entitlementLabels`
- `balanceCents`
- `availableBalanceCents`
- `frozenBalanceCents`
- `activeEntitlements`

`accountSummary.providerIdentities` now includes:

- provider label and provider user id
- `authorizationStatus = active | revoked | unlinked`
- `loginEnabled`, `linkedAt`, `lastAuthorizedAt`, and optional revocation metadata
- per-provider action descriptors for `unlink`, `revoke`, and `reauthorize`

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
- `ticketList`
- `recommendedFaqEntries`
- `faqCatalog`
- `supportEntries`
- `supportEntry`
- `serviceLoopSummary`
- `latestTicket`
- `latestStatus`
- `latestCategory`

`faqCatalog` and `supportEntries` are now durable runtime data in the sample store instead of being reconstructed as purely static page defaults.

### `POST /feedback`

Creates a feedback ticket using the shared feedback form payload and returns:

- `feedbackTicket`
- `feedbackCategory`
- `feedbackStatus`

`feedbackStatus` now carries FAQ recommendations, queue/assignee/SLA metadata, a bounded support entry, revisit semantics, and processing history so the client does not invent a separate support model.

Each submitted ticket creates a dedicated customer-service thread and links that thread back through `feedbackTicket.supportThreadId` and `feedbackStatus.supportEntry.threadId`.

Feedback submission also appends feedback-scope security audit events and participates in the centralized rate-limit baseline.

### `GET /feedback/tickets`

Lists durable ticket summaries for the current user.

- supports `page`, `pageSize`, `state`, `categoryKey`, and `keyword`
- returns `ticketList`, `faqCatalog`, and `supportEntries`
- ticket summaries include queue, assignee, SLA, label, and support-thread linkage

### `POST /feedback/ticket/action`

Applies support-operator style updates to a ticket.

Supported mutations include:

- moving a ticket into `triaged`, `in_progress`, `waiting_user`, `resolved`, or `closed`
- updating `priority`, `labels`, `assignee`, `queueKey/queueLabel`, and `sla`
- appending a processing-history note
- optionally sending a synchronized support reply into the linked customer-service thread

Returns:

- `feedbackTicket`
- `feedbackCategory`
- `feedbackStatus`
- `ticketList`

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
- relays the follow-up into the ticket-linked customer-service thread when one exists

## Auth Semantics

- `401` means unauthenticated or token expired
- `403` means authenticated but forbidden
- `429` means auth abuse controls blocked the request for the current client window
- `POST /auth/refresh` should return `401` when the refresh token is expired, revoked, or invalid
- `POST /auth/login`, `POST /auth/refresh`, `POST /membership/purchase`, `POST /uploads/session`, `POST /share/prepare`, `POST /feedback`, `POST /messages/thread/create`, and `POST /messages/thread/send` may return `429` with code `RATE_LIMITED`
- `POST /auth/login` no longer validates static demo phone codes or static demo passwords by default; phone-code login uses stored verification challenges and password login uses hashed stored credentials
- OAuth login/callback rejects missing, expired, or mismatched state with `credentialProtection.failureReason = "oauth_state_invalid"`
- identity workflow endpoints should use `identityWorkflow.status` for merge-required or blocked business outcomes instead of forcing every branch through transport errors
- payment endpoints should return `callbackVerification`, `reconciliation`, and optional `operationResult` as part of the order detail surface when transaction operations mutate state
- upload endpoints should return backend-backed lifecycle, checksum, review, cleanup, and reference-binding fields so consuming features do not invent their own moderation or storage semantics
- share endpoints should preserve attribution ids, landing targets, and auth-aligned return targets so growth flows do not invent a parallel redirect model
- message endpoints should keep notification lists, thread summaries, and thread bodies as distinct but aligned outputs
- settings endpoints should treat `effectivePolicy` as the source of truth for delivery, privacy exposure, upload behavior, and debug control editability
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
- the standalone novel hosts now expose the shared discover/feed route in addition to catalog, detail, TOC, reader, and bookshelf so shared editorial discovery is visible without collapsing the novel-specific extension layer

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
- notification browsing remains sample-backed through `/notifications`, while conversation-capable message flows now extend through `/messages/threads`, `/messages/thread`, `/messages/thread/create`, `/messages/thread/read`, `/messages/thread/send`, `/messages/thread/retry`, and `/messages/thread/sync`
- provider setup, callback domains, capability support, and accepted deferred release gaps are documented in [`docs/PRODUCTION_READINESS.md`](/Users/bingrong.yan/projects/birdor/minix/docs/PRODUCTION_READINESS.md)

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

Membership purchase remains a dedicated convenience entrypoint, but it now maps into the same shared product/SKU/order model used by `/orders/purchase`.

Use `providerMode = "sample"` for local mock payment behavior. Use `providerMode = "production"` with `wechat_pay` or `h5_pay` to receive gateway references, signed client parameters, and durable payment ledger records.

Additional sample semantics:

- instant-success and pending purchases append durable asset ledger entries for wallet consumption, freezes, entitlement grant, and purchase reward points
- generic SKU purchases append the same normalized entitlement-ledger records for subscription, one-time, and value-added fulfillment
- subscription orders expose renewal, cancellation, grace, and after-sales state through `/subscriptions` and `/after-sales/*`
- follow-up transaction operations such as `POST /payments/callback`, `POST /orders/cancel`, and `POST /orders/refund` return `operationResult.assetLedgerIds` so clients can trace the applied ledger records
- membership purchase also appends payment-scope security audit events and participates in the centralized rate-limit baseline

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

## Operational Diagnostics

The sample API now keeps a durable `operational_state` snapshot alongside persisted `user_state`.

This governance layer records:

- domain schema counts for `sessions`, `credentials`, `orders`, `uploads`, `messages`, `content`, `feedback`, and `audit_events`
- migration/backfill records for operational bootstrap
- background jobs for `upload_cleanup`, `payment_reconciliation`, `notification_retry`, and `cancellation_expiry`
- monitoring events for failed jobs and rejected payment callbacks
- administrative audit trail entries for job scheduling and manual job runs

### `GET /ops/diagnostics`

Returns the current operational snapshot for the signed-in user context.

Supported query params:

- `limit`
- `includeCompletedJobs`

Suggested response shape:

```json
{
  "schemaVersion": 1,
  "lastSweepAt": "2026-04-11T09:00:00.000Z",
  "domainSchemas": [],
  "migrations": [],
  "backgroundJobs": [],
  "monitoringEvents": [],
  "auditTrail": [],
  "governance": {
    "queuedJobs": 0,
    "failedJobs": 0,
    "retryableNotifications": 0,
    "appliedMigrations": 2
  }
}
```

### `POST /ops/jobs/run`

Runs queued operational jobs idempotently for the signed-in user context.

Supported request fields:

- `kind`
- `limit`

Suggested response shape:

```json
{
  "processedJobs": [],
  "diagnostics": {
    "schemaVersion": 1,
    "backgroundJobs": [],
    "governance": {
      "queuedJobs": 0,
      "failedJobs": 0,
      "retryableNotifications": 0,
      "appliedMigrations": 2
    }
  }
}
```

Operational scheduling hooks in the sample API currently cover:

- upload cancel and rejected review paths enqueue `upload_cleanup`
- pending membership or SKU orders and post-callback mismatches enqueue `payment_reconciliation`
- failed outbound customer-service delivery enqueues `notification_retry`
- account cancellation cooling-off windows enqueue `cancellation_expiry`

## Shared Form Workflow Notes

Account operations, feedback intake, and managed content authoring now share one form-platform contract layer:

- `FormSchema.fields` can describe `text`, `number`, `date`, `single_select`, `multi_select`, `upload_reference`, and `rich_text` placeholder fields
- `FormSchema.steps` and `FormFieldDefinition.conditions` drive step order and conditional visibility instead of feature-local switch statements
- `FormWorkflowState.draft` carries `draftId`, `recoveryKey`, `lastSavedAt`, and `restoredAt` so draft recovery can survive route/session restoration
- `FormWorkflowState.approvalNodes` carries node state plus assignee metadata for cancellation review, support triage, and content review queues
- `FormSubmitState.submissionKey`, `lastCompletedKey`, and `duplicateBlocked` are the shared duplicate-submit guardrail used by draft-save and submit flows

## Demo-Only Notes

- Storage keys such as `reader.display`, `reader.session`, and `novel.reading-center` are client-side runtime details, not backend contract fields.
- Page-level groupings like pinned bookshelf titles or derived recommendation lanes are currently computed client-side from the shared API payloads above.
