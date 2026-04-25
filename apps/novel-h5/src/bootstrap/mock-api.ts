import {
  coerceMockQueryNumber,
  coerceMockQueryString,
  createError,
  createJsonMockResponse,
  fail,
  matchesMockBearerAuthorizationHeader,
  ok,
  resolveMockRequestPath,
  type RequestAdapter,
  type RequestOptions,
} from "@minix/core";
import type {
  AddToBookshelfRequest,
  BookshelfItem,
  BookshelfMutationResponse,
  BookshelfResponse,
  ChapterContent,
  ChapterSummary,
  ChapterListResponse,
  ContentAccess,
  ContentCard,
  ContentDetail,
  ContentDisplay,
  ContentLifecycle,
  LoadReadingProgressResponse,
  MembershipOverview,
  NovelDetail,
  NovelListResponse,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  RelatedNovelSummary,
  ReadingProgress,
  RemoveFromBookshelfRequest,
  SaveReadingProgressRequest,
} from "@minix/contracts";

type QueryValue = string | number | boolean | undefined;
type RawNovelDetail = Omit<NovelDetail, "contentDetail" | "contentAccess">;

function createMockCoverUrl(title: string, accent: string, backgroundStart: string, backgroundEnd: string): string {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080" role="img" aria-label="${title} cover">`,
    "<defs>",
    `  <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">`,
    `    <stop offset="0%" stop-color="${backgroundStart}"/>`,
    `    <stop offset="100%" stop-color="${backgroundEnd}"/>`,
    "  </linearGradient>",
    "</defs>",
    `  <rect width="720" height="1080" fill="url(#bg)"/>`,
    `  <circle cx="560" cy="220" r="130" fill="${accent}" fill-opacity="0.15"/>`,
    `  <rect x="84" y="84" width="552" height="912" rx="28" fill="none" stroke="${accent}" stroke-opacity="0.45"/>`,
    `  <text x="112" y="320" font-size="82" font-weight="700" font-family="Georgia, 'Times New Roman', serif" fill="#f8f3ea">${title}</text>`,
    `  <text x="112" y="930" font-size="28" font-family="'Helvetica Neue', Arial, sans-serif" fill="${accent}" letter-spacing="6">MINIX MOCK SAMPLE</text>`,
    "</svg>",
  ].join("");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const MOCK_COVER_URLS = {
  lantern: createMockCoverUrl("Ashes Of The Lantern", "#f4b860", "#0f1d2f", "#314a5f"),
  brocade: createMockCoverUrl("Brocade Pavilion", "#f0c987", "#401321", "#854459"),
  sword: createMockCoverUrl("Sword Before Dawn", "#d8e6ef", "#142027", "#44606d"),
  orchid: createMockCoverUrl("Orchid Ledger", "#d7d69f", "#1f3125", "#5d7e55"),
  glass: createMockCoverUrl("Glass Harbor", "#f6ddb1", "#10283a", "#4a84a1"),
} as const;

const ACCESS_TOKEN = "mock-novel-h5-access-token";
const MEMBERSHIP_OVERVIEW: MembershipOverview = {
  active: false,
  tier: "signed-in",
  entitlementScope: "none",
  statusLabel: "Signed in with standard reading access",
  renewalLabel: "Upgrade to unlock full serialized reading",
  headline: "Membership Center",
  subheadline: "Unlock paid chapters, long-form serials, and cleaner continuation across devices.",
  benefits: [
    { key: "locked-chapters", label: "Locked Chapter Access", description: "Open chapters that sit behind the free and trial boundary." },
    { key: "full-serials", label: "Full Serial Access", description: "Continue reading on premium or membership-only titles without interruption." },
    { key: "priority-updates", label: "Priority Updates", description: "Keep reading progress and update cues aligned across the shelf and reader." },
  ],
};

const MEMBER_RENEWAL_LABELS: Record<PurchaseMembershipRequest["planId"], string> = {
  monthly: "Monthly plan active",
  quarterly: "Quarterly plan active",
  annual: "Annual plan active",
};

const DEFAULT_BOOKSHELF_NOVEL_IDS = ["novel_lantern", "novel_brocade"] as const;
let progressByNovelIdRef: Record<string, ReadingProgress> | undefined;

function createNovelContentLifecycle(detail: RawNovelDetail | NovelDetail): ContentLifecycle {
  const updatedAt = detail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z";
  return {
    state: "published",
    availableActions: ["update", "archive", "delete"],
    publishedAt: updatedAt,
    updatedAt,
  };
}

function createNovelContentDisplay(
  detail: RawNovelDetail | NovelDetail,
  slot: ContentDisplay["recommendationSlot"],
  slotLabel: string,
): ContentDisplay {
  return {
    category: { key: detail.categoryKey, label: detail.categoryLabel },
    tags: detail.tags.map((tag) => ({ key: tag.key, label: tag.label })),
    topics: detail.tags.slice(0, 2).map((tag) => ({ key: tag.key, label: tag.label })),
    ...(slot ? { recommendationSlot: slot } : {}),
    recommendationSlotLabel: slotLabel,
    pinned: detail.status === "serializing",
    featured: detail.requiresMembership || detail.status === "serializing",
  };
}

function createNovelContentAccess(detail: RawNovelDetail | NovelDetail): ContentAccess {
  const purchased = Boolean(detail.isPurchased);
  return {
    visibility: detail.requiresMembership ? "member_only" : "public",
    accessible: !detail.requiresMembership || purchased || detail.isFree,
    previewAvailable: Boolean(detail.isFree || detail.isTrial),
    requiresLogin: false,
    requiresMembership: detail.requiresMembership,
    requiresPurchase: false,
    purchased,
    summaryLabel:
      detail.accessRuleSummaryLabel ??
      (detail.requiresMembership
        ? "This title stays in the premium lane until membership unlocks the complete reading route after the visible preview boundary."
        : "Open-access reading continues without a paywall in the current sample surface."),
    ...(detail.requiresMembership ? { gateLabel: "Membership required for full reading" } : {}),
    ...(detail.requiresMembership ? { entitlementLabel: "Membership unlock" } : {}),
  };
}

function createNovelContentDetail(detail: RawNovelDetail | NovelDetail): ContentDetail {
  return {
    contentId: detail.id,
    model: "novel_story",
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    summary: detail.summary,
    ...(detail.coverUrl ? { coverUrl: detail.coverUrl } : {}),
    authorLabel: detail.author.name,
    display: createNovelContentDisplay(
      detail,
      detail.requiresMembership ? "premium" : detail.status === "serializing" ? "frontlist" : "ranking",
      detail.requiresMembership ? "Premium Spotlight" : detail.status === "serializing" ? "Frontlist Serial" : "Completed Archive",
    ),
    lifecycle: createNovelContentLifecycle(detail),
    ...(detail.relatedLaneLabel ? { recommendationReason: detail.relatedLaneLabel } : {}),
  };
}

function createNovelContentCard(
  detail: NovelDetail,
  continueChapterId?: string,
  continueChapterTitle?: string,
): ContentCard {
  const slot = continueChapterId
    ? "continue_reading"
    : detail.requiresMembership
      ? "premium"
      : detail.status === "serializing"
        ? "frontlist"
        : "ranking";
  const slotLabel = continueChapterId
    ? continueChapterTitle
      ? `Continue · ${continueChapterTitle}`
      : "Continue Reading"
    : detail.requiresMembership
      ? "Premium Spotlight"
      : detail.status === "serializing"
        ? "Frontlist Serial"
        : "Completed Archive";

  return {
    contentId: detail.id,
    model: "novel_story",
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    summary: detail.summary,
    ...(detail.coverUrl ? { coverUrl: detail.coverUrl } : {}),
    authorLabel: detail.author.name,
    display: createNovelContentDisplay(detail, slot, slotLabel),
    lifecycle: createNovelContentLifecycle(detail),
  };
}

function enrichNovelDetail(detail: RawNovelDetail): NovelDetail {
  return {
    ...detail,
    contentDetail: createNovelContentDetail(detail),
    contentAccess: createNovelContentAccess(detail),
  };
}

const RAW_NOVELS: RawNovelDetail[] = [
  {
    id: "novel_lantern",
    slug: "ashes-of-the-lantern",
    title: "Ashes Of The Lantern",
    subtitle: "A slow-burn mystery inside a rain-soaked canal city",
    author: {
      id: "author_lin",
      name: "Lin Yue",
      bio: "Writes atmospheric mysteries about memory, ritual, and cities that refuse to sleep.",
    },
    coverUrl: MOCK_COVER_URLS.lantern,
    summary:
      "When an archivist inherits a forbidden lantern that reveals hidden rooms in the city, every glow uncovers another debt, another missing witness, and another chapter of a murder the canal district tried to drown.",
    categoryKey: "mystery",
    categoryLabel: "Mystery",
    tags: [
      { key: "serial", label: "Serial" },
      { key: "noir", label: "Noir" },
      { key: "slow-burn", label: "Slow Burn" },
    ],
    status: "serializing",
    wordCount: 182000,
    chapterCount: 6,
    readingCount: 22840,
    bookshelfCount: 6240,
    ratingScore: 4.8,
    ratingCount: 6320,
    favoriteCount: 18420,
    updateCadenceLabel: "Updates twice weekly on Tuesday and Friday",
    updateHistoryLabel: "The last three chapters landed across four days, so the mystery arc still feels hot and current.",
    trialRuleLabel: "Open access title with uninterrupted reading across the current serial run",
    accessRuleSummaryLabel: "No membership wall interrupts the current serial route, so the strongest choice here is simply whether to continue now or shelf it for tonight.",
    authorPresenceLabel: "Lin Yue's mysteries are known for ritual clues, soaked city atmospheres, and chapters that always end one revelation too early.",
    relatedLaneLabel: "Readers who stay for ritual noir and city memory usually move next into merchant mysteries or prestige court intrigue.",
    latestChapter: {
      id: "lantern_ch_06",
      title: "Chapter 6 · The Ember Ledger",
      order: 6,
      updatedAt: "2026-03-22T08:00:00.000Z",
    },
    firstChapterId: "lantern_ch_01",
    continueChapterId: "lantern_ch_03",
    isFree: true,
    isTrial: true,
    requiresMembership: false,
    isPurchased: true,
  },
  {
    id: "novel_brocade",
    slug: "brocade-pavilion",
    title: "Brocade Pavilion",
    subtitle: "Court intrigue woven through silk, debt, and inherited names",
    author: {
      id: "author_qiao",
      name: "Qiao An",
      bio: "Known for palace dramas with sharp dialogue and tightly wound emotional stakes.",
    },
    coverUrl: MOCK_COVER_URLS.brocade,
    summary:
      "A forgotten daughter is summoned back to the capital to manage the family pavilion, only to discover the embroidery ledgers hide bribes, coded confessions, and a succession war no one dares to say aloud.",
    categoryKey: "fantasy",
    categoryLabel: "Fantasy",
    tags: [
      { key: "court", label: "Court Politics" },
      { key: "romance", label: "Romance" },
      { key: "completed", label: "Completed" },
    ],
    status: "completed",
    wordCount: 264000,
    chapterCount: 4,
    readingCount: 45120,
    bookshelfCount: 10300,
    ratingScore: 4.9,
    ratingCount: 9810,
    favoriteCount: 22640,
    updateCadenceLabel: "Completed run with full archive access for members",
    updateHistoryLabel: "The archive is complete, which means every chapter handoff now reads as a clean unlock proposition instead of a moving serial schedule.",
    trialRuleLabel: "Trial opens the first two chapters before the membership boundary locks the full run",
    accessRuleSummaryLabel: "The trial is generous enough to prove tone and stakes, but the decisive unlock moment arrives as soon as the court ledger plot fully opens.",
    authorPresenceLabel: "Qiao An's court dramas sell on sharp dialogue, inheritance pressure, and emotional reversals that keep every chapter feeling expensive.",
    relatedLaneLabel: "Readers who convert on premium court drama often cross into archive fantasy and other titles with strong household politics.",
    latestChapter: {
      id: "brocade_ch_04",
      title: "Chapter 4 · The Final Stitch",
      order: 4,
      updatedAt: "2026-03-12T08:00:00.000Z",
    },
    firstChapterId: "brocade_ch_01",
    continueChapterId: "brocade_ch_02",
    isFree: false,
    isTrial: true,
    requiresMembership: true,
    isPurchased: false,
  },
  {
    id: "novel_sword",
    slug: "sword-before-dawn",
    title: "Sword Before Dawn",
    subtitle: "A road novel about sect rivalries and one impossible oath",
    author: {
      id: "author_shen",
      name: "Shen Mo",
      bio: "Builds martial worlds that feel intimate first and epic second.",
    },
    coverUrl: MOCK_COVER_URLS.sword,
    summary:
      "After breaking his sect's final commandment, a swordsman escorts a witness across three provinces while every school along the road decides whether to collect the bounty or hear the truth.",
    categoryKey: "wuxia",
    categoryLabel: "Wuxia",
    tags: [
      { key: "journey", label: "Journey" },
      { key: "sects", label: "Sect Conflict" },
    ],
    status: "serializing",
    wordCount: 138000,
    chapterCount: 5,
    readingCount: 18540,
    bookshelfCount: 4910,
    ratingScore: 4.6,
    ratingCount: 4010,
    favoriteCount: 12110,
    updateCadenceLabel: "Weekly Saturday update cadence",
    updateHistoryLabel: "A steadier weekly rhythm makes this title feel dependable, with update expectations that suit long-road reading habits.",
    trialRuleLabel: "Open access serial with no membership boundary on the current route",
    accessRuleSummaryLabel: "Open access keeps the path clean here, so the detail page's job is mostly to reinforce trust in cadence and continuation.",
    authorPresenceLabel: "Shen Mo writes martial travelogues that feel intimate before they scale outward, which keeps the road-story pitch grounded.",
    relatedLaneLabel: "Readers who stay for oath-driven journeys usually continue into slower serials with a strong witness or investigation spine.",
    latestChapter: {
      id: "sword_ch_05",
      title: "Chapter 5 · Under The Watchtower",
      order: 5,
      updatedAt: "2026-03-21T08:00:00.000Z",
    },
    firstChapterId: "sword_ch_01",
    continueChapterId: "sword_ch_02",
    isFree: true,
    isTrial: false,
    requiresMembership: false,
    isPurchased: true,
  },
  {
    id: "novel_orchid",
    slug: "orchid-ledger",
    title: "Orchid Ledger",
    subtitle: "Merchant intrigue, river guilds, and a ledger that outlives its owners",
    author: {
      id: "author_ji",
      name: "Ji Wen",
      bio: "Writes mercantile epics built on debt, loyalty, and the weight of inherited cities.",
    },
    coverUrl: MOCK_COVER_URLS.orchid,
    summary:
      "After a warehouse fire wipes out the river market's records, a junior clerk discovers one orchid-stamped ledger survived. Every page points to a shipment that never arrived and a guild elder who was never supposed to die.",
    categoryKey: "mystery",
    categoryLabel: "Mystery",
    tags: [
      { key: "guilds", label: "Guild Politics" },
      { key: "merchant", label: "Merchant Drama" },
      { key: "slow", label: "Slow Build" },
    ],
    status: "serializing",
    wordCount: 206000,
    chapterCount: 3,
    readingCount: 17420,
    bookshelfCount: 4130,
    ratingScore: 4.7,
    ratingCount: 3580,
    favoriteCount: 10920,
    updateCadenceLabel: "New chapters land whenever the guild ledger arc resolves",
    updateHistoryLabel: "Recent chapter drops cluster around major ledger reveals, so update timing feels event-driven instead of weekly routine.",
    trialRuleLabel: "Trial-enabled mystery with open continuation through the current chapter list",
    accessRuleSummaryLabel: "Trial remains open on the current route, so this title behaves like a low-friction conversion from curiosity into shelf intent.",
    authorPresenceLabel: "Ji Wen leans into merchant pressure, civic scale, and procedural clue trails that reward readers who like systems as much as drama.",
    relatedLaneLabel: "Readers who click into merchant mysteries tend to keep browsing adjacent guild, archive, and prestige intrigue titles.",
    latestChapter: {
      id: "orchid_ch_03",
      title: "Chapter 3 · The Missing Seal",
      order: 3,
      updatedAt: "2026-03-23T08:00:00.000Z",
    },
    firstChapterId: "orchid_ch_01",
    continueChapterId: "orchid_ch_02",
    isFree: true,
    isTrial: true,
    requiresMembership: false,
    isPurchased: true,
  },
  {
    id: "novel_glass",
    slug: "glass-harbor",
    title: "Glass Harbor",
    subtitle: "A paused coastal fantasy with saints, tariffs, and weather cults",
    author: {
      id: "author_rao",
      name: "Rao Yin",
      bio: "Blends luminous settings with political fantasy and strong episodic arcs.",
    },
    coverUrl: MOCK_COVER_URLS.glass,
    summary:
      "At the edge of a harbor where weather can be bought and sold, a customs translator finds a shrine register naming ships that sank years before their captains were born.",
    categoryKey: "fantasy",
    categoryLabel: "Fantasy",
    tags: [
      { key: "harbor", label: "Harbor City" },
      { key: "paused", label: "Paused Run" },
      { key: "premium", label: "Premium" },
    ],
    status: "paused",
    wordCount: 149000,
    chapterCount: 3,
    readingCount: 13240,
    bookshelfCount: 2975,
    ratingScore: 4.5,
    ratingCount: 2890,
    favoriteCount: 8740,
    updateCadenceLabel: "Paused title with archive maintenance and occasional premium bonus notes",
    updateHistoryLabel: "Because the run is paused, update history matters more than cadence: readers need to know this is an archive with occasional movement, not an abandoned listing.",
    trialRuleLabel: "Trial preview covers the opening chapter before premium continuation begins",
    accessRuleSummaryLabel: "The opening trial exists to sell atmosphere first, then let premium continuation carry the paused archive for committed readers.",
    authorPresenceLabel: "Rao Yin's coastal fantasies trade on luminous settings and political weather systems, which makes the pause status part of the dossier story.",
    relatedLaneLabel: "Readers who still buy into paused premium worlds often browse for adjacent fantasy archives with strong setting-first appeal.",
    latestChapter: {
      id: "glass_ch_03",
      title: "Chapter 3 · Tariff For Rain",
      order: 3,
      updatedAt: "2026-03-09T08:00:00.000Z",
    },
    firstChapterId: "glass_ch_01",
    continueChapterId: "glass_ch_01",
    isFree: false,
    isTrial: true,
    requiresMembership: true,
    isPurchased: false,
  },
];

const NOVELS: NovelDetail[] = RAW_NOVELS.map(enrichNovelDetail);

const CHAPTER_LISTS: Record<string, ChapterListResponse> = {
  novel_lantern: {
    novelId: "novel_lantern",
    totalChapters: 6,
    continueChapterId: "lantern_ch_03",
    volumes: [
      {
        id: "lantern_vol_01",
        novelId: "novel_lantern",
        title: "Volume I · Rain Archive",
        order: 1,
        chapters: [
          { id: "lantern_ch_01", novelId: "novel_lantern", volumeId: "lantern_vol_01", title: "Chapter 1 · The Closed Stack", order: 1, wordCount: 4200, updatedAt: "2026-03-18T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
          { id: "lantern_ch_02", novelId: "novel_lantern", volumeId: "lantern_vol_01", title: "Chapter 2 · A Door Behind Smoke", order: 2, wordCount: 4380, updatedAt: "2026-03-19T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
          { id: "lantern_ch_03", novelId: "novel_lantern", volumeId: "lantern_vol_01", title: "Chapter 3 · Witness On The Water", order: 3, wordCount: 4510, updatedAt: "2026-03-20T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
        ],
      },
      {
        id: "lantern_vol_02",
        novelId: "novel_lantern",
        title: "Volume II · Heat Signature",
        order: 2,
        chapters: [
          { id: "lantern_ch_04", novelId: "novel_lantern", volumeId: "lantern_vol_02", title: "Chapter 4 · The Narrow Courtyard", order: 4, wordCount: 4630, updatedAt: "2026-03-21T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
          { id: "lantern_ch_05", novelId: "novel_lantern", volumeId: "lantern_vol_02", title: "Chapter 5 · Ink On Wet Stone", order: 5, wordCount: 4720, updatedAt: "2026-03-21T12:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
          { id: "lantern_ch_06", novelId: "novel_lantern", volumeId: "lantern_vol_02", title: "Chapter 6 · The Ember Ledger", order: 6, wordCount: 4880, updatedAt: "2026-03-22T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
        ],
      },
    ],
  },
  novel_brocade: {
    novelId: "novel_brocade",
    totalChapters: 4,
    continueChapterId: "brocade_ch_02",
    volumes: [
      {
        id: "brocade_vol_01",
        novelId: "novel_brocade",
        title: "Volume I · Capital Thread",
        order: 1,
        chapters: [
          { id: "brocade_ch_01", novelId: "novel_brocade", volumeId: "brocade_vol_01", title: "Chapter 1 · Return To The Pavilion", order: 1, wordCount: 5180, updatedAt: "2026-03-10T08:00:00.000Z", isFree: false, isTrial: true, requiresMembership: true, isPurchased: false },
          { id: "brocade_ch_02", novelId: "novel_brocade", volumeId: "brocade_vol_01", title: "Chapter 2 · Gold Thread Accounts", order: 2, wordCount: 5260, updatedAt: "2026-03-10T12:00:00.000Z", isFree: false, isTrial: true, requiresMembership: true, isPurchased: false },
          { id: "brocade_ch_03", novelId: "novel_brocade", volumeId: "brocade_vol_01", title: "Chapter 3 · The Unnamed Seal", order: 3, wordCount: 5340, updatedAt: "2026-03-11T08:00:00.000Z", isFree: false, isTrial: false, requiresMembership: true, isPurchased: false },
          { id: "brocade_ch_04", novelId: "novel_brocade", volumeId: "brocade_vol_01", title: "Chapter 4 · The Final Stitch", order: 4, wordCount: 5420, updatedAt: "2026-03-12T08:00:00.000Z", isFree: false, isTrial: false, requiresMembership: true, isPurchased: false },
        ],
      },
    ],
  },
  novel_sword: {
    novelId: "novel_sword",
    totalChapters: 5,
    continueChapterId: "sword_ch_02",
    volumes: [
      {
        id: "sword_vol_01",
        novelId: "novel_sword",
        title: "Volume I · Road Oath",
        order: 1,
        chapters: [
          { id: "sword_ch_01", novelId: "novel_sword", volumeId: "sword_vol_01", title: "Chapter 1 · Frost On The Ferry", order: 1, wordCount: 4010, updatedAt: "2026-03-17T08:00:00.000Z", isFree: true, isTrial: false, requiresMembership: false, isPurchased: true },
          { id: "sword_ch_02", novelId: "novel_sword", volumeId: "sword_vol_01", title: "Chapter 2 · The Salt Merchant's Son", order: 2, wordCount: 4160, updatedAt: "2026-03-18T08:00:00.000Z", isFree: true, isTrial: false, requiresMembership: false, isPurchased: true },
          { id: "sword_ch_03", novelId: "novel_sword", volumeId: "sword_vol_01", title: "Chapter 3 · Wind Over The Shrine", order: 3, wordCount: 4230, updatedAt: "2026-03-19T08:00:00.000Z", isFree: true, isTrial: false, requiresMembership: false, isPurchased: true },
          { id: "sword_ch_04", novelId: "novel_sword", volumeId: "sword_vol_01", title: "Chapter 4 · Three Schools Waiting", order: 4, wordCount: 4380, updatedAt: "2026-03-20T08:00:00.000Z", isFree: true, isTrial: false, requiresMembership: false, isPurchased: true },
          { id: "sword_ch_05", novelId: "novel_sword", volumeId: "sword_vol_01", title: "Chapter 5 · Under The Watchtower", order: 5, wordCount: 4460, updatedAt: "2026-03-21T08:00:00.000Z", isFree: true, isTrial: false, requiresMembership: false, isPurchased: true },
        ],
      },
    ],
  },
  novel_orchid: {
    novelId: "novel_orchid",
    totalChapters: 3,
    continueChapterId: "orchid_ch_02",
    volumes: [
      {
        id: "orchid_vol_01",
        novelId: "novel_orchid",
        title: "Volume I · River Freight",
        order: 1,
        chapters: [
          { id: "orchid_ch_01", novelId: "novel_orchid", volumeId: "orchid_vol_01", title: "Chapter 1 · Ash In The Warehouse", order: 1, wordCount: 4670, updatedAt: "2026-03-21T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
          { id: "orchid_ch_02", novelId: "novel_orchid", volumeId: "orchid_vol_01", title: "Chapter 2 · Freight Without Witness", order: 2, wordCount: 4790, updatedAt: "2026-03-22T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
          { id: "orchid_ch_03", novelId: "novel_orchid", volumeId: "orchid_vol_01", title: "Chapter 3 · The Missing Seal", order: 3, wordCount: 4930, updatedAt: "2026-03-23T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
        ],
      },
    ],
  },
  novel_glass: {
    novelId: "novel_glass",
    totalChapters: 3,
    continueChapterId: "glass_ch_01",
    volumes: [
      {
        id: "glass_vol_01",
        novelId: "novel_glass",
        title: "Volume I · Weather Port",
        order: 1,
        chapters: [
          { id: "glass_ch_01", novelId: "novel_glass", volumeId: "glass_vol_01", title: "Chapter 1 · Customs Bell", order: 1, wordCount: 4510, updatedAt: "2026-03-07T08:00:00.000Z", isFree: false, isTrial: true, requiresMembership: true, isPurchased: false },
          { id: "glass_ch_02", novelId: "novel_glass", volumeId: "glass_vol_01", title: "Chapter 2 · Ledger Of Tides", order: 2, wordCount: 4630, updatedAt: "2026-03-08T08:00:00.000Z", isFree: false, isTrial: true, requiresMembership: true, isPurchased: false },
          { id: "glass_ch_03", novelId: "novel_glass", volumeId: "glass_vol_01", title: "Chapter 3 · Tariff For Rain", order: 3, wordCount: 4760, updatedAt: "2026-03-09T08:00:00.000Z", isFree: false, isTrial: false, requiresMembership: true, isPurchased: false },
        ],
      },
    ],
  },
};

const CHAPTER_CONTENT: Record<string, ChapterContent> = {
  lantern_ch_01: { id: "lantern_ch_01", novelId: "novel_lantern", title: "Chapter 1 · The Closed Stack", order: 1, wordCount: 4200, updatedAt: "2026-03-18T08:00:00.000Z", nav: { nextChapterId: "lantern_ch_02" }, isFree: true, isTrial: true, requiresMembership: false, isPurchased: true, content: "Rain moved through the canal city like a second archive.\n\nEvery ledger swelled at the edges, every rope bridge remembered a different weight, and every closed room collected the smell of ash before dawn.\n\nWhen Yan Luo opened the inherited lantern, the wall beside the closed stack did not crumble. It simply admitted it had always been a door." },
  lantern_ch_02: { id: "lantern_ch_02", novelId: "novel_lantern", title: "Chapter 2 · A Door Behind Smoke", order: 2, wordCount: 4380, updatedAt: "2026-03-19T08:00:00.000Z", nav: { previousChapterId: "lantern_ch_01", nextChapterId: "lantern_ch_03" }, isFree: true, isTrial: true, requiresMembership: false, isPurchased: true, content: "The room behind the wall contained no treasure.\n\nIt held a table, a cup gone cold, and a witness statement someone had tried to erase with steam.\n\nThe signature remained. The date did not." },
  lantern_ch_03: { id: "lantern_ch_03", novelId: "novel_lantern", title: "Chapter 3 · Witness On The Water", order: 3, wordCount: 4510, updatedAt: "2026-03-20T08:00:00.000Z", nav: { previousChapterId: "lantern_ch_02", nextChapterId: "lantern_ch_04" }, isFree: true, isTrial: true, requiresMembership: false, isPurchased: true, content: "A woman waited on the mooring steps with one shoe in her hand and canal mud on her sleeve.\n\nShe said she had seen the body three nights before the city claimed it existed.\n\nShe said the lantern had already been lit." },
  lantern_ch_04: { id: "lantern_ch_04", novelId: "novel_lantern", title: "Chapter 4 · The Narrow Courtyard", order: 4, wordCount: 4630, updatedAt: "2026-03-21T08:00:00.000Z", nav: { previousChapterId: "lantern_ch_03", nextChapterId: "lantern_ch_05" }, isFree: true, isTrial: true, requiresMembership: false, isPurchased: true, content: "The courtyard could only be reached when the lantern dimmed.\n\nEvery brick carried a different family mark, as if the city had built the place from confiscated homes.\n\nThere, between drainage stones, Yan Luo found the first ember ledger." },
  lantern_ch_05: { id: "lantern_ch_05", novelId: "novel_lantern", title: "Chapter 5 · Ink On Wet Stone", order: 5, wordCount: 4720, updatedAt: "2026-03-21T12:00:00.000Z", nav: { previousChapterId: "lantern_ch_04", nextChapterId: "lantern_ch_06" }, isFree: true, isTrial: true, requiresMembership: false, isPurchased: true, content: "The ledger was written in ordinary commerce codes, but the totals made no sense.\n\nNo district ordered that much lamp oil in flood season.\n\nNo district admitted buying fire after midnight at all." },
  lantern_ch_06: { id: "lantern_ch_06", novelId: "novel_lantern", title: "Chapter 6 · The Ember Ledger", order: 6, wordCount: 4880, updatedAt: "2026-03-22T08:00:00.000Z", nav: { previousChapterId: "lantern_ch_05" }, isFree: true, isTrial: true, requiresMembership: false, isPurchased: true, content: "Every name in the ledger belonged to someone officially dead.\n\nSome had drowned. Some had disappeared. One had signed the archivist's inheritance order.\n\nYan Luo closed the lantern only when the paper beneath it began to glow back." },
  brocade_ch_01: { id: "brocade_ch_01", novelId: "novel_brocade", title: "Chapter 1 · Return To The Pavilion", order: 1, wordCount: 5180, updatedAt: "2026-03-10T08:00:00.000Z", nav: { nextChapterId: "brocade_ch_02" }, isFree: false, isTrial: true, requiresMembership: true, isPurchased: false, trialEndOffset: 520, content: "No one in the capital welcomed a daughter who had already been written out of the family genealogy.\n\nBut the accounts welcomed her less.\n\nEvery silk roll in Brocade Pavilion had been sold twice." },
  brocade_ch_02: { id: "brocade_ch_02", novelId: "novel_brocade", title: "Chapter 2 · Gold Thread Accounts", order: 2, wordCount: 5260, updatedAt: "2026-03-10T12:00:00.000Z", nav: { previousChapterId: "brocade_ch_01", nextChapterId: "brocade_ch_03" }, isFree: false, isTrial: true, requiresMembership: true, isPurchased: false, trialEndOffset: 460, content: "The fake ledgers were beautiful.\n\nMargins gilded, errors symmetrical, each lie balanced with the elegance of a wedding sleeve.\n\nWhoever forged them expected admiration before suspicion." },
  brocade_ch_03: { id: "brocade_ch_03", novelId: "novel_brocade", title: "Chapter 3 · The Unnamed Seal", order: 3, wordCount: 5340, updatedAt: "2026-03-11T08:00:00.000Z", nav: { previousChapterId: "brocade_ch_02", nextChapterId: "brocade_ch_04" }, isFree: false, isTrial: false, requiresMembership: true, isPurchased: false, content: "Behind the third drawer lay a wax seal without a household mark.\n\nIn the capital, anonymity was more dangerous than accusation.\n\nIt meant the order came from above the family tree." },
  brocade_ch_04: { id: "brocade_ch_04", novelId: "novel_brocade", title: "Chapter 4 · The Final Stitch", order: 4, wordCount: 5420, updatedAt: "2026-03-12T08:00:00.000Z", nav: { previousChapterId: "brocade_ch_03" }, isFree: false, isTrial: false, requiresMembership: true, isPurchased: false, content: "The last robe on the stand was unfinished only at the collar.\n\nA single red thread waited there, enough to save the design or ruin the wearer.\n\nShe left the needle where anyone with rank could see it." },
  sword_ch_01: { id: "sword_ch_01", novelId: "novel_sword", title: "Chapter 1 · Frost On The Ferry", order: 1, wordCount: 4010, updatedAt: "2026-03-17T08:00:00.000Z", nav: { nextChapterId: "sword_ch_02" }, isFree: true, isTrial: false, requiresMembership: false, isPurchased: true, content: "By dawn the ferry ropes had frozen stiff enough to sing.\n\nLu Shen stood on the deck with one hand on his scabbard and one eye on the witness who had not slept.\n\nThe bounty notices had reached the river before they had." },
  sword_ch_02: { id: "sword_ch_02", novelId: "novel_sword", title: "Chapter 2 · The Salt Merchant's Son", order: 2, wordCount: 4160, updatedAt: "2026-03-18T08:00:00.000Z", nav: { previousChapterId: "sword_ch_01", nextChapterId: "sword_ch_03" }, isFree: true, isTrial: false, requiresMembership: false, isPurchased: true, content: "The boy claimed he had never touched a sword.\n\nBut when the ambush began he stepped aside exactly once, at exactly the right angle, as though someone had trained him to survive other people's violence." },
  sword_ch_03: { id: "sword_ch_03", novelId: "novel_sword", title: "Chapter 3 · Wind Over The Shrine", order: 3, wordCount: 4230, updatedAt: "2026-03-19T08:00:00.000Z", nav: { previousChapterId: "sword_ch_02", nextChapterId: "sword_ch_04" }, isFree: true, isTrial: false, requiresMembership: false, isPurchased: true, content: "The shrine had no priest, only a bell and a sword notch in the oldest cedar.\n\nLu Shen recognized the cut. So did the men following them uphill." },
  sword_ch_04: { id: "sword_ch_04", novelId: "novel_sword", title: "Chapter 4 · Three Schools Waiting", order: 4, wordCount: 4380, updatedAt: "2026-03-20T08:00:00.000Z", nav: { previousChapterId: "sword_ch_03", nextChapterId: "sword_ch_05" }, isFree: true, isTrial: false, requiresMembership: false, isPurchased: true, content: "Three schools waited on the road and each claimed jurisdiction over justice.\n\nOnly one brought tea.\n\nThat made them the most dangerous." },
  sword_ch_05: { id: "sword_ch_05", novelId: "novel_sword", title: "Chapter 5 · Under The Watchtower", order: 5, wordCount: 4460, updatedAt: "2026-03-21T08:00:00.000Z", nav: { previousChapterId: "sword_ch_04" }, isFree: true, isTrial: false, requiresMembership: false, isPurchased: true, content: "The tower keeper never asked names.\n\nHe asked who had lied first, which in Lu Shen's experience was another way of asking who would survive the morning.\n\nBelow them, the road lit with torches." },
  orchid_ch_01: { id: "orchid_ch_01", novelId: "novel_orchid", title: "Chapter 1 · Ash In The Warehouse", order: 1, wordCount: 4670, updatedAt: "2026-03-21T08:00:00.000Z", nav: { nextChapterId: "orchid_ch_02" }, isFree: true, isTrial: true, requiresMembership: false, isPurchased: true, content: "By morning the warehouse had burned so cleanly that the surviving ledger felt planted.\n\nIts orchid stamp belonged to a guild house that closed three seasons ago.\n\nYet the ink on the shipping column was still wet enough to stain her sleeve." },
  orchid_ch_02: { id: "orchid_ch_02", novelId: "novel_orchid", title: "Chapter 2 · Freight Without Witness", order: 2, wordCount: 4790, updatedAt: "2026-03-22T08:00:00.000Z", nav: { previousChapterId: "orchid_ch_01", nextChapterId: "orchid_ch_03" }, isFree: true, isTrial: true, requiresMembership: false, isPurchased: true, content: "Every freight record on the river had two signatures except the orchid pages.\n\nThose had one seal and no witnesses.\n\nIn a port city, that meant someone expected the river itself to testify." },
  orchid_ch_03: { id: "orchid_ch_03", novelId: "novel_orchid", title: "Chapter 3 · The Missing Seal", order: 3, wordCount: 4930, updatedAt: "2026-03-23T08:00:00.000Z", nav: { previousChapterId: "orchid_ch_02" }, isFree: true, isTrial: true, requiresMembership: false, isPurchased: true, content: "The seal should have hung from the guild chain wall.\n\nInstead it lay beneath the water stair, wrapped in sailcloth and tied with mourning thread.\n\nWhoever hid it knew the market would search upward first." },
  glass_ch_01: { id: "glass_ch_01", novelId: "novel_glass", title: "Chapter 1 · Customs Bell", order: 1, wordCount: 4510, updatedAt: "2026-03-07T08:00:00.000Z", nav: { nextChapterId: "glass_ch_02" }, isFree: false, isTrial: true, requiresMembership: true, isPurchased: false, trialEndOffset: 420, content: "The customs bell rang three times for a ship no one could see.\n\nAt Glass Harbor, invisible cargo still paid tax.\n\nThat was how Mina learned the weather priests had begun billing absence." },
  glass_ch_02: { id: "glass_ch_02", novelId: "novel_glass", title: "Chapter 2 · Ledger Of Tides", order: 2, wordCount: 4630, updatedAt: "2026-03-08T08:00:00.000Z", nav: { previousChapterId: "glass_ch_01", nextChapterId: "glass_ch_03" }, isFree: false, isTrial: true, requiresMembership: true, isPurchased: false, trialEndOffset: 410, content: "The tide ledger listed imports by storm pattern rather than by captain.\n\nA red mark sat beside tomorrow's rain even though the sky was clear.\n\nSomeone had already sold the weather before it arrived." },
  glass_ch_03: { id: "glass_ch_03", novelId: "novel_glass", title: "Chapter 3 · Tariff For Rain", order: 3, wordCount: 4760, updatedAt: "2026-03-09T08:00:00.000Z", nav: { previousChapterId: "glass_ch_02" }, isFree: false, isTrial: false, requiresMembership: true, isPurchased: false, content: "By sunset the harbor gates closed against incoming cloud.\n\nCustoms officers stood with dry ledgers while rain waited offshore like unpaid freight.\n\nMina understood then that the city intended to tax the sky itself." },
};

function ensureAuthorized(options: RequestOptions) {
  return matchesMockBearerAuthorizationHeader(options.headers?.Authorization, ACCESS_TOKEN);
}

function createMembershipOverview(planId?: PurchaseMembershipRequest["planId"]): MembershipOverview {
  if (!planId) {
    return MEMBERSHIP_OVERVIEW;
  }

  return {
    active: true,
    tier: "member",
    entitlementScope: "membership",
    statusLabel: "Membership active with premium reading unlocked",
    renewalLabel: MEMBER_RENEWAL_LABELS[planId],
    headline: "Membership Active",
    subheadline: "Premium reading is now unlocked. You can return to the blocked title and keep going without losing context.",
    benefits: MEMBERSHIP_OVERVIEW.benefits,
  };
}

function createBookshelfCountResolver(bookshelfNovelIds: Set<string>) {
  const initialBookshelfNovelIds = new Set<string>(DEFAULT_BOOKSHELF_NOVEL_IDS);

  return (detail: NovelDetail): number | undefined => {
    if (detail.bookshelfCount === undefined) {
      return detail.bookshelfCount;
    }

    if (bookshelfNovelIds.has(detail.id) && !initialBookshelfNovelIds.has(detail.id)) {
      return detail.bookshelfCount + 1;
    }

    if (!bookshelfNovelIds.has(detail.id) && initialBookshelfNovelIds.has(detail.id)) {
      return Math.max(0, detail.bookshelfCount - 1);
    }

    return detail.bookshelfCount;
  };
}

function isPurchasedByMembership(record: { requiresMembership: boolean; isPurchased?: boolean }, membershipActive: boolean): boolean {
  return Boolean(record.isPurchased || (record.requiresMembership && membershipActive));
}

function toMembershipAwareNovelDetail(
  detail: NovelDetail,
  membershipActive: boolean,
  bookshelfNovelIds?: Set<string>,
): NovelDetail {
  const resolveBookshelfCount = bookshelfNovelIds ? createBookshelfCountResolver(bookshelfNovelIds) : undefined;
  const bookshelfCount = resolveBookshelfCount?.(detail);

  const resolvedDetail = {
    ...detail,
    isPurchased: isPurchasedByMembership(detail, membershipActive),
    ...(bookshelfCount !== undefined ? { bookshelfCount } : {}),
    ...(bookshelfNovelIds ? { inBookshelf: bookshelfNovelIds.has(detail.id) } : {}),
    relatedNovels: createRelatedNovelSummaries(detail, membershipActive),
  };

  return {
    ...resolvedDetail,
    contentDetail: createNovelContentDetail(resolvedDetail),
    contentAccess: createNovelContentAccess(resolvedDetail),
  };
}

function resolveNovelAccess(detail: NovelDetail, membershipActive: boolean): NovelDetail {
  const resolvedDetail = {
    ...detail,
    isPurchased: isPurchasedByMembership(detail, membershipActive),
  };
  return {
    ...resolvedDetail,
    contentDetail: createNovelContentDetail(resolvedDetail),
    contentAccess: createNovelContentAccess(resolvedDetail),
  };
}

function createRelatedNovelSummaries(
  detail: NovelDetail,
  membershipActive: boolean,
): RelatedNovelSummary[] {
  return NOVELS.filter((candidate) => candidate.id !== detail.id)
    .sort((left, right) => {
      const leftScore = Number(left.categoryKey === detail.categoryKey) * 2 + Number(left.status === detail.status);
      const rightScore = Number(right.categoryKey === detail.categoryKey) * 2 + Number(right.status === detail.status);
      return rightScore - leftScore;
    })
    .slice(0, 3)
    .map((candidate) => {
      const resolvedCandidate = resolveNovelAccess(candidate, membershipActive);
      return {
        id: resolvedCandidate.id,
        title: resolvedCandidate.title,
        authorName: resolvedCandidate.author.name,
        categoryLabel: resolvedCandidate.categoryLabel,
        status: resolvedCandidate.status,
        requiresMembership: resolvedCandidate.requiresMembership && !resolvedCandidate.isPurchased,
        highlight:
          resolvedCandidate.categoryKey === detail.categoryKey
            ? `Shared ${resolvedCandidate.categoryLabel.toLowerCase()} lane`
            : resolvedCandidate.status === detail.status
              ? `Similar ${resolvedCandidate.status} rhythm`
              : "Editorially adjacent pick",
      };
    });
}

function toMembershipAwareChapterSummary(chapter: ChapterSummary, membershipActive: boolean): ChapterSummary {
  return {
    ...chapter,
    isPurchased: isPurchasedByMembership(chapter, membershipActive),
  };
}

function toMembershipAwareChapterList(response: ChapterListResponse, membershipActive: boolean): ChapterListResponse {
  return {
    ...response,
    volumes: response.volumes.map((volume) => ({
      ...volume,
      chapters: volume.chapters.map((chapter) => toMembershipAwareChapterSummary(chapter, membershipActive)),
    })),
  };
}

function toMembershipAwareChapterContent(chapter: ChapterContent, membershipActive: boolean): ChapterContent {
  return {
    ...chapter,
    isPurchased: isPurchasedByMembership(chapter, membershipActive),
  };
}

function deriveReturnTarget(source?: string): PurchaseMembershipResponse["returnTarget"] {
  if (source === "reader") {
    return "reader";
  }

  if (source === "detail") {
    return "detail";
  }

  return "catalog";
}

function toNovelCard(detail: NovelDetail, membershipActive = false, bookshelfNovelIds?: Set<string>) {
  const resolvedDetail = toMembershipAwareNovelDetail(detail, membershipActive, bookshelfNovelIds);
  const progress = progressByNovelIdRef?.[resolvedDetail.id];
  const continueChapterId = progress?.chapterId ?? resolvedDetail.continueChapterId ?? resolvedDetail.firstChapterId;
  const continueChapterTitle = continueChapterId ? CHAPTER_CONTENT[continueChapterId]?.title : undefined;

  return {
    id: resolvedDetail.id,
    slug: resolvedDetail.slug,
    title: resolvedDetail.title,
    authorName: resolvedDetail.author.name,
    summary: resolvedDetail.summary,
    categoryKey: resolvedDetail.categoryKey,
    categoryLabel: resolvedDetail.categoryLabel,
    tags: resolvedDetail.tags,
    status: resolvedDetail.status,
    updatedAt: resolvedDetail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z",
    wordCount: resolvedDetail.wordCount,
    isFree: resolvedDetail.isFree,
    isTrial: resolvedDetail.isTrial,
    requiresMembership: resolvedDetail.requiresMembership,
    ...(resolvedDetail.latestChapter?.id ? { latestChapterId: resolvedDetail.latestChapter.id } : {}),
    ...(resolvedDetail.latestChapter?.title ? { latestChapterTitle: resolvedDetail.latestChapter.title } : {}),
    ...(resolvedDetail.latestChapter?.order !== undefined ? { latestChapterOrder: resolvedDetail.latestChapter.order } : {}),
    ...(continueChapterId ? { continueChapterId } : {}),
    ...(continueChapterTitle ? { continueChapterTitle } : {}),
    ...(resolvedDetail.readingCount !== undefined ? { readingCount: resolvedDetail.readingCount } : {}),
    ...(resolvedDetail.bookshelfCount !== undefined ? { bookshelfCount: resolvedDetail.bookshelfCount } : {}),
    ...(resolvedDetail.coverUrl ? { coverUrl: resolvedDetail.coverUrl } : {}),
    ...(resolvedDetail.isPurchased !== undefined ? { isPurchased: resolvedDetail.isPurchased } : {}),
    contentCard: createNovelContentCard(resolvedDetail, continueChapterId, continueChapterTitle),
    contentAccess: createNovelContentAccess(resolvedDetail),
  };
}

function listNovels(
  query: RequestOptions["query"] | undefined,
  membershipActive: boolean,
  bookshelfNovelIds?: Set<string>,
): NovelListResponse {
  const page = coerceMockQueryNumber(query?.page, 1);
  const pageSize = coerceMockQueryNumber(query?.pageSize, 6);
  const categoryKey = coerceMockQueryString(query?.categoryKey);
  const status = coerceMockQueryString(query?.status);
  const keyword = coerceMockQueryString(query?.keyword) ?? "";
  const normalizedKeyword = keyword.toLowerCase();
  const sort = coerceMockQueryString(query?.sort) ?? "recommended";

  const allCards = NOVELS.map((detail) => toNovelCard(detail, membershipActive, bookshelfNovelIds));
  let cards = [...allCards];

  if (categoryKey && categoryKey !== "all") {
    cards = cards.filter((item) => item.categoryKey === categoryKey);
  }

  if (status && status !== "all") {
    cards = cards.filter((item) => item.status === status);
  }

  if (normalizedKeyword) {
    cards = cards.filter((item) =>
      [item.title, item.authorName, item.summary].some((value) => value.toLowerCase().includes(normalizedKeyword)),
    );
  }

  if (sort === "updatedAt") {
    cards.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } else if (sort === "popular") {
    cards.sort((left, right) => (right.readingCount ?? 0) - (left.readingCount ?? 0));
  } else if (sort === "wordCount") {
    cards.sort((left, right) => right.wordCount - left.wordCount);
  }

  const start = (page - 1) * pageSize;
  const items = cards.slice(start, start + pageSize);
  const hasMore = start + pageSize < cards.length;

  return {
    items,
    page,
    pageSize,
    hasMore,
    searchQuery: {
      keyword,
      mode: "domain",
      domain: "novel",
      page,
      pageSize,
    },
    searchFilters: [
      {
        key: "category",
        label: "Category",
        selectedKeys: categoryKey && categoryKey !== "all" ? [categoryKey] : [],
        options: [{ key: "all", label: "All", count: allCards.length }],
      },
      {
        key: "status",
        label: "Status",
        selectedKeys: status && status !== "all" ? [status] : [],
        options: [{ key: "all", label: "Any status", count: allCards.length }],
      },
    ],
    searchResults: {
      items,
      total: cards.length,
      hasMore,
      emptyText: keyword ? `No novels matched "${keyword}".` : "No novels found yet.",
      suggestionTerms: ["lantern", "brocade", "orchid"],
      hotKeywords: ["lantern", "brocade", "sword", "orchid"],
      recentKeywords: [],
      sortOptions: [
        { key: "recommended", label: "Recommended" },
        { key: "updatedAt", label: "Latest" },
        { key: "popular", label: "Popular" },
        { key: "wordCount", label: "Length" },
      ],
      activeSortKey: sort,
    },
  };
}

function createBookshelfItem(
  detail: NovelDetail,
  progressByNovelId: Record<string, ReadingProgress>,
  membershipActive: boolean,
  bookshelfNovelIds: Set<string>,
): BookshelfItem {
  const resolvedDetail = toMembershipAwareNovelDetail(detail, membershipActive, bookshelfNovelIds);
  const progress = progressByNovelId[detail.id];
  const continueChapterId = progress?.chapterId ?? resolvedDetail.continueChapterId ?? resolvedDetail.firstChapterId;
  const continueChapterTitle = continueChapterId ? CHAPTER_CONTENT[continueChapterId]?.title : undefined;
  const latestChapterId = resolvedDetail.latestChapter?.id;

  return {
    novelId: resolvedDetail.id,
    title: resolvedDetail.title,
    authorName: resolvedDetail.author.name,
    ...(resolvedDetail.coverUrl ? { coverUrl: resolvedDetail.coverUrl } : {}),
    ...(resolvedDetail.latestChapter?.title ? { latestChapterTitle: resolvedDetail.latestChapter.title } : {}),
    ...(continueChapterId ? { continueChapterId } : {}),
    ...(continueChapterTitle ? { continueChapterTitle } : {}),
    ...(progress?.progressPercent !== undefined ? { progressPercent: progress.progressPercent } : {}),
    updatedAt: progress?.updatedAt ?? resolvedDetail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z",
    hasUpdate: Boolean(latestChapterId && continueChapterId && latestChapterId !== continueChapterId),
  };
}

function createBookshelf(
  bookshelfNovelIds: Set<string>,
  progressByNovelId: Record<string, ReadingProgress>,
  membershipActive: boolean,
): BookshelfResponse {
  return {
    items: NOVELS.filter((detail) => bookshelfNovelIds.has(detail.id))
      .map((detail) => createBookshelfItem(detail, progressByNovelId, membershipActive, bookshelfNovelIds))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
}

export function createNovelH5MockApiAdapter(): RequestAdapter {
  let activeMembershipPlanId: PurchaseMembershipRequest["planId"] | undefined;
  const bookshelfNovelIds = new Set<string>(DEFAULT_BOOKSHELF_NOVEL_IDS);
  const progressByNovelId: Record<string, ReadingProgress> = {
    novel_lantern: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
      chapterTitle: "Chapter 3 · Witness On The Water",
      progressPercent: 0.46,
      updatedAt: "2026-03-22T08:00:00.000Z",
    },
    novel_brocade: {
      novelId: "novel_brocade",
      chapterId: "brocade_ch_04",
      chapterTitle: "Chapter 4 · The Final Stitch",
      progressPercent: 1,
      updatedAt: "2026-03-12T08:00:00.000Z",
    },
  };
  progressByNovelIdRef = progressByNovelId;

  return {
    async request<T = unknown>(options: RequestOptions) {
      const pathname = resolveMockRequestPath(options.url);

      if (pathname === "/auth/login") {
        return ok(
          createJsonMockResponse(200, {
            userId: "novel-h5-user",
            accessToken: ACCESS_TOKEN,
            expiresAt: Date.now() + 60 * 60 * 1000,
            profile: {
              nickname: "Novel Builder",
            },
          } as T),
        );
      }

      if (!ensureAuthorized(options)) {
        return ok(
          createJsonMockResponse(401, {
            code: "UNAUTHORIZED",
            message: "Novel session expired. Please sign in again.",
          } as T),
        );
      }

      if (pathname === "/novels") {
        return ok(createJsonMockResponse(200, listNovels(options.query, Boolean(activeMembershipPlanId), bookshelfNovelIds) as T));
      }

      if (pathname === "/novels/detail") {
        const novelId = coerceMockQueryString(options.query?.novelId);
        const detail = NOVELS.find((item) => item.id === novelId);
        if (!detail) {
          return ok(createJsonMockResponse(404, { code: "NOT_FOUND" } as T));
        }

        return ok(createJsonMockResponse(200, toMembershipAwareNovelDetail(detail, Boolean(activeMembershipPlanId), bookshelfNovelIds) as T));
      }

      if (pathname === "/chapters") {
        const novelId = coerceMockQueryString(options.query?.novelId);
        const response = novelId ? CHAPTER_LISTS[novelId] : undefined;
        if (!response) {
          return ok(createJsonMockResponse(404, { code: "NOT_FOUND" } as T));
        }

        return ok(createJsonMockResponse(200, toMembershipAwareChapterList(response, Boolean(activeMembershipPlanId)) as T));
      }

      if (pathname === "/chapters/content") {
        const chapterId = coerceMockQueryString(options.query?.chapterId);
        const response = chapterId ? CHAPTER_CONTENT[chapterId] : undefined;
        if (!response) {
          return ok(createJsonMockResponse(404, { code: "NOT_FOUND" } as T));
        }

        return ok(createJsonMockResponse(200, toMembershipAwareChapterContent(response, Boolean(activeMembershipPlanId)) as T));
      }

      if (pathname === "/bookshelf" && options.method === "POST") {
        const payload = (options.body ?? {}) as AddToBookshelfRequest;
        const detail = NOVELS.find((item) => item.id === payload.novelId);
        if (!detail) {
          return ok(createJsonMockResponse(404, { code: "NOT_FOUND" } as T));
        }

        bookshelfNovelIds.add(payload.novelId);
        const updatedDetail = toMembershipAwareNovelDetail(detail, Boolean(activeMembershipPlanId), bookshelfNovelIds);
        const response: BookshelfMutationResponse = {
          novelId: payload.novelId,
          inBookshelf: true,
          bookshelfCount: updatedDetail.bookshelfCount ?? 0,
          items: createBookshelf(bookshelfNovelIds, progressByNovelId, Boolean(activeMembershipPlanId)).items,
        };

        return ok(createJsonMockResponse(200, response as T));
      }

      if (pathname === "/bookshelf" && options.method === "GET") {
        return ok(createJsonMockResponse(200, createBookshelf(bookshelfNovelIds, progressByNovelId, Boolean(activeMembershipPlanId)) as T));
      }

      if (pathname === "/bookshelf" && options.method === "DELETE") {
        const payload = (options.body ?? {}) as RemoveFromBookshelfRequest;
        const detail = NOVELS.find((item) => item.id === payload.novelId);
        if (!detail) {
          return ok(createJsonMockResponse(404, { code: "NOT_FOUND" } as T));
        }

        bookshelfNovelIds.delete(payload.novelId);
        const updatedDetail = toMembershipAwareNovelDetail(detail, Boolean(activeMembershipPlanId), bookshelfNovelIds);
        const response: BookshelfMutationResponse = {
          novelId: payload.novelId,
          inBookshelf: false,
          bookshelfCount: updatedDetail.bookshelfCount ?? 0,
          items: createBookshelf(bookshelfNovelIds, progressByNovelId, Boolean(activeMembershipPlanId)).items,
        };

        return ok(createJsonMockResponse(200, response as T));
      }

      if (pathname === "/membership" && options.method === "GET") {
        return ok(createJsonMockResponse(200, createMembershipOverview(activeMembershipPlanId) as T));
      }

      if (pathname === "/membership/purchase" && options.method === "POST") {
        const payload = (options.body ?? {}) as PurchaseMembershipRequest;
        activeMembershipPlanId = payload.planId;
        const overview = createMembershipOverview(activeMembershipPlanId);
        const orderId = "ord_novel_h5_membership";

        const response: PurchaseMembershipResponse = {
          purchased: true,
          overview,
          order: {
            orderId,
            title: "Membership Purchase",
            status: "paid",
            productType: "membership",
            channel: payload.channel ?? "h5_pay",
            currency: "CNY",
            totalAmountCents: payload.planId === "monthly" ? 1900 : payload.planId === "annual" ? 15900 : 4900,
            duplicateProtected: false,
            createdAt: "2026-04-08T10:00:00.000Z",
            updatedAt: "2026-04-08T10:00:00.000Z",
            lineItems: [
              {
                productId: `membership_${payload.planId}`,
                productType: "membership",
                title: "Membership Purchase",
                quantity: 1,
                unitAmountCents: payload.planId === "monthly" ? 1900 : payload.planId === "annual" ? 15900 : 4900,
                totalAmountCents: payload.planId === "monthly" ? 1900 : payload.planId === "annual" ? 15900 : 4900,
              },
            ],
          },
          paymentIntent: {
            intentId: "pi_novel_h5_membership",
            orderId,
            channel: payload.channel ?? "h5_pay",
            status: "succeeded",
            clientAction: "h5_redirect",
          },
          paymentResult: {
            orderId,
            status: "success",
            paid: true,
            duplicateProtected: false,
            callbackVerified: false,
            message: "Mock payment completed.",
          },
          entitlement: {
            entitlementId: "ent_novel_h5_membership",
            productType: "membership",
            active: true,
            statusLabel: overview.statusLabel,
            sourceOrderId: orderId,
            overview,
          },
          returnTarget: deriveReturnTarget(payload.source),
          ...(payload.source ? { source: payload.source } : {}),
          ...(payload.novelId ? { novelId: payload.novelId } : {}),
          ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
        };

        return ok(createJsonMockResponse(200, response as T));
      }

      if (pathname === "/reading-progress" && options.method === "GET") {
        const novelId = coerceMockQueryString(options.query?.novelId);
        const progress = novelId ? progressByNovelId[novelId] ?? null : null;
        const response: LoadReadingProgressResponse = { progress };
        return ok(createJsonMockResponse(200, response as T));
      }

      if (pathname === "/reading-progress" && options.method === "POST") {
        const payload = options.body as SaveReadingProgressRequest;
        const chapter = CHAPTER_CONTENT[payload.chapterId];
        const updatedAt = new Date().toISOString();
        progressByNovelId[payload.novelId] = {
          novelId: payload.novelId,
          chapterId: payload.chapterId,
          progressPercent: payload.progressPercent,
          updatedAt,
          ...(chapter?.title ? { chapterTitle: chapter.title } : {}),
          ...(payload.pageIndex !== undefined ? { pageIndex: payload.pageIndex } : {}),
          ...(payload.scrollOffset !== undefined ? { scrollOffset: payload.scrollOffset } : {}),
        };

        return ok(
          createJsonMockResponse(200, {
            saved: true,
            progress: {
              ...payload,
              updatedAt,
            },
          } as T),
        );
      }

      return fail(
        createError("NOT_FOUND", `Novel H5 mock route not found: ${pathname}`, {
          recoverable: true,
        }),
      );
    },
  };
}
