import {
  coerceMockQueryString,
  createJsonMockResponse,
  createMockRouteNotFoundError,
  createMockSvgCoverDataUrl,
  fail,
  matchesMockBearerAuthorizationHeader,
  matchesMockRequestRoute,
  ok,
  paginateMockItems,
  resolveMockRequestPath,
  type RequestAdapter,
  type RequestOptions,
} from "@minix/core";
import type {
  BookshelfResponse,
  ChapterContent,
  ChapterListResponse,
  LoadReadingProgressResponse,
  MembershipOverview,
  NovelDetail,
  NovelListResponse,
  ReadingProgress,
  SaveReadingProgressRequest,
} from "@minix/contracts";

import {
  createNovelContentAccess,
  createNovelContentCard,
  createNovelContentDetail,
  enrichNovelDetail,
  type RawNovelDetail,
} from "./mock-content";

type QueryValue = string | number | boolean | undefined;

const MOCK_COVER_URLS = {
  lantern: createMockSvgCoverDataUrl({
    title: "Ashes Of The Lantern",
    accent: "#f4b860",
    backgroundStart: "#0f1d2f",
    backgroundEnd: "#314a5f",
  }),
  brocade: createMockSvgCoverDataUrl({
    title: "Brocade Pavilion",
    accent: "#f0c987",
    backgroundStart: "#401321",
    backgroundEnd: "#854459",
  }),
  sword: createMockSvgCoverDataUrl({
    title: "Sword Before Dawn",
    accent: "#d8e6ef",
    backgroundStart: "#142027",
    backgroundEnd: "#44606d",
  }),
} as const;

const ACCESS_TOKEN = "mock-novel-wechat-access-token";
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

const RAW_NOVELS: RawNovelDetail[] = [
  {
    id: "novel_lantern",
    slug: "ashes-of-the-lantern",
    title: "Ashes Of The Lantern",
    subtitle: "A slow-burn mystery inside a rain-soaked canal city",
    author: { id: "author_lin", name: "Lin Yue", bio: "Writes atmospheric mysteries about memory, ritual, and cities that refuse to sleep." },
    coverUrl: MOCK_COVER_URLS.lantern,
    summary: "When an archivist inherits a forbidden lantern that reveals hidden rooms in the city, every glow uncovers another debt, another missing witness, and another chapter of a murder the canal district tried to drown.",
    categoryKey: "mystery",
    categoryLabel: "Mystery",
    tags: [{ key: "serial", label: "Serial" }, { key: "noir", label: "Noir" }, { key: "slow-burn", label: "Slow Burn" }],
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
    accessRuleSummaryLabel: "No membership wall interrupts the current serial route, so the strongest choice here is whether to continue now or shelf it for later.",
    authorPresenceLabel: "Lin Yue's mysteries are known for ritual clues, soaked city atmospheres, and chapters that always end one revelation too early.",
    relatedLaneLabel: "Readers who stay for ritual noir and city memory usually move next into merchant mysteries or prestige court intrigue.",
    latestChapter: { id: "lantern_ch_06", title: "Chapter 6 · The Ember Ledger", order: 6, updatedAt: "2026-03-22T08:00:00.000Z" },
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
    author: { id: "author_qiao", name: "Qiao An", bio: "Known for palace dramas with sharp dialogue and tightly wound emotional stakes." },
    coverUrl: MOCK_COVER_URLS.brocade,
    summary: "A forgotten daughter is summoned back to the capital to manage the family pavilion, only to discover the embroidery ledgers hide bribes, coded confessions, and a succession war no one dares to say aloud.",
    categoryKey: "fantasy",
    categoryLabel: "Fantasy",
    tags: [{ key: "court", label: "Court Politics" }, { key: "romance", label: "Romance" }, { key: "completed", label: "Completed" }],
    status: "completed",
    wordCount: 264000,
    chapterCount: 4,
    readingCount: 45120,
    bookshelfCount: 10300,
    ratingScore: 4.9,
    ratingCount: 9810,
    favoriteCount: 22640,
    updateCadenceLabel: "Completed run with full archive access for members",
    updateHistoryLabel: "The archive is complete, which makes every chapter handoff read as a clean unlock proposition instead of a moving serial schedule.",
    trialRuleLabel: "Trial opens the first two chapters before the membership boundary locks the full run",
    accessRuleSummaryLabel: "The trial proves tone and stakes early, but the decisive unlock moment arrives as soon as the court ledger plot fully opens.",
    authorPresenceLabel: "Qiao An's court dramas sell on sharp dialogue, inheritance pressure, and emotional reversals that keep every chapter feeling expensive.",
    relatedLaneLabel: "Readers who convert on premium court drama often cross into archive fantasy and other titles with strong household politics.",
    latestChapter: { id: "brocade_ch_04", title: "Chapter 4 · The Final Stitch", order: 4, updatedAt: "2026-03-12T08:00:00.000Z" },
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
    author: { id: "author_shen", name: "Shen Mo", bio: "Builds martial worlds that feel intimate first and epic second." },
    coverUrl: MOCK_COVER_URLS.sword,
    summary: "After breaking his sect's final commandment, a swordsman escorts a witness across three provinces while every school along the road decides whether to collect the bounty or hear the truth.",
    categoryKey: "wuxia",
    categoryLabel: "Wuxia",
    tags: [{ key: "journey", label: "Journey" }, { key: "sects", label: "Sect Conflict" }],
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
    latestChapter: { id: "sword_ch_05", title: "Chapter 5 · Under The Watchtower", order: 5, updatedAt: "2026-03-21T08:00:00.000Z" },
    firstChapterId: "sword_ch_01",
    continueChapterId: "sword_ch_02",
    isFree: true,
    isTrial: false,
    requiresMembership: false,
    isPurchased: true,
  },
];

const NOVELS: NovelDetail[] = RAW_NOVELS.map(enrichNovelDetail);

const CHAPTER_LISTS: Record<string, ChapterListResponse> = {
  novel_lantern: {
    novelId: "novel_lantern",
    totalChapters: 6,
    continueChapterId: "lantern_ch_03",
    volumes: [
      { id: "lantern_vol_01", novelId: "novel_lantern", title: "Volume I · Rain Archive", order: 1, chapters: [
        { id: "lantern_ch_01", novelId: "novel_lantern", volumeId: "lantern_vol_01", title: "Chapter 1 · The Closed Stack", order: 1, wordCount: 4200, updatedAt: "2026-03-18T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
        { id: "lantern_ch_02", novelId: "novel_lantern", volumeId: "lantern_vol_01", title: "Chapter 2 · A Door Behind Smoke", order: 2, wordCount: 4380, updatedAt: "2026-03-19T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
        { id: "lantern_ch_03", novelId: "novel_lantern", volumeId: "lantern_vol_01", title: "Chapter 3 · Witness On The Water", order: 3, wordCount: 4510, updatedAt: "2026-03-20T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
      ] },
      { id: "lantern_vol_02", novelId: "novel_lantern", title: "Volume II · Heat Signature", order: 2, chapters: [
        { id: "lantern_ch_04", novelId: "novel_lantern", volumeId: "lantern_vol_02", title: "Chapter 4 · The Narrow Courtyard", order: 4, wordCount: 4630, updatedAt: "2026-03-21T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
        { id: "lantern_ch_05", novelId: "novel_lantern", volumeId: "lantern_vol_02", title: "Chapter 5 · Ink On Wet Stone", order: 5, wordCount: 4720, updatedAt: "2026-03-21T12:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
        { id: "lantern_ch_06", novelId: "novel_lantern", volumeId: "lantern_vol_02", title: "Chapter 6 · The Ember Ledger", order: 6, wordCount: 4880, updatedAt: "2026-03-22T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
      ] },
    ],
  },
  novel_brocade: {
    novelId: "novel_brocade",
    totalChapters: 4,
    continueChapterId: "brocade_ch_02",
    volumes: [
      { id: "brocade_vol_01", novelId: "novel_brocade", title: "Volume I · Capital Thread", order: 1, chapters: [
        { id: "brocade_ch_01", novelId: "novel_brocade", volumeId: "brocade_vol_01", title: "Chapter 1 · Return To The Pavilion", order: 1, wordCount: 5180, updatedAt: "2026-03-10T08:00:00.000Z", isFree: false, isTrial: true, requiresMembership: true, isPurchased: false },
        { id: "brocade_ch_02", novelId: "novel_brocade", volumeId: "brocade_vol_01", title: "Chapter 2 · Gold Thread Accounts", order: 2, wordCount: 5260, updatedAt: "2026-03-10T12:00:00.000Z", isFree: false, isTrial: true, requiresMembership: true, isPurchased: false },
        { id: "brocade_ch_03", novelId: "novel_brocade", volumeId: "brocade_vol_01", title: "Chapter 3 · The Unnamed Seal", order: 3, wordCount: 5340, updatedAt: "2026-03-11T08:00:00.000Z", isFree: false, isTrial: false, requiresMembership: true, isPurchased: false },
        { id: "brocade_ch_04", novelId: "novel_brocade", volumeId: "brocade_vol_01", title: "Chapter 4 · The Final Stitch", order: 4, wordCount: 5420, updatedAt: "2026-03-12T08:00:00.000Z", isFree: false, isTrial: false, requiresMembership: true, isPurchased: false },
      ] },
    ],
  },
  novel_sword: {
    novelId: "novel_sword",
    totalChapters: 5,
    continueChapterId: "sword_ch_02",
    volumes: [
      { id: "sword_vol_01", novelId: "novel_sword", title: "Volume I · Road Oath", order: 1, chapters: [
        { id: "sword_ch_01", novelId: "novel_sword", volumeId: "sword_vol_01", title: "Chapter 1 · Frost On The Ferry", order: 1, wordCount: 4010, updatedAt: "2026-03-17T08:00:00.000Z", isFree: true, isTrial: false, requiresMembership: false, isPurchased: true },
        { id: "sword_ch_02", novelId: "novel_sword", volumeId: "sword_vol_01", title: "Chapter 2 · The Salt Merchant's Son", order: 2, wordCount: 4160, updatedAt: "2026-03-18T08:00:00.000Z", isFree: true, isTrial: false, requiresMembership: false, isPurchased: true },
        { id: "sword_ch_03", novelId: "novel_sword", volumeId: "sword_vol_01", title: "Chapter 3 · Wind Over The Shrine", order: 3, wordCount: 4230, updatedAt: "2026-03-19T08:00:00.000Z", isFree: true, isTrial: false, requiresMembership: false, isPurchased: true },
        { id: "sword_ch_04", novelId: "novel_sword", volumeId: "sword_vol_01", title: "Chapter 4 · Three Schools Waiting", order: 4, wordCount: 4380, updatedAt: "2026-03-20T08:00:00.000Z", isFree: true, isTrial: false, requiresMembership: false, isPurchased: true },
        { id: "sword_ch_05", novelId: "novel_sword", volumeId: "sword_vol_01", title: "Chapter 5 · Under The Watchtower", order: 5, wordCount: 4460, updatedAt: "2026-03-21T08:00:00.000Z", isFree: true, isTrial: false, requiresMembership: false, isPurchased: true },
      ] },
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
};

function ensureAuthorized(options: RequestOptions) {
  return matchesMockBearerAuthorizationHeader(options.headers?.Authorization, ACCESS_TOKEN);
}

function toNovelCard(detail: NovelDetail) {
  return {
    id: detail.id,
    slug: detail.slug,
    title: detail.title,
    authorName: detail.author.name,
    summary: detail.summary,
    categoryKey: detail.categoryKey,
    categoryLabel: detail.categoryLabel,
    tags: detail.tags,
    status: detail.status,
    updatedAt: detail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z",
    wordCount: detail.wordCount,
    isFree: detail.isFree,
    isTrial: detail.isTrial,
    requiresMembership: detail.requiresMembership,
    ...(detail.latestChapter?.id ? { latestChapterId: detail.latestChapter.id } : {}),
    ...(detail.latestChapter?.title ? { latestChapterTitle: detail.latestChapter.title } : {}),
    ...(detail.latestChapter?.order !== undefined ? { latestChapterOrder: detail.latestChapter.order } : {}),
    ...(detail.readingCount !== undefined ? { readingCount: detail.readingCount } : {}),
    ...(detail.bookshelfCount !== undefined ? { bookshelfCount: detail.bookshelfCount } : {}),
    ...(detail.coverUrl ? { coverUrl: detail.coverUrl } : {}),
    ...(detail.isPurchased !== undefined ? { isPurchased: detail.isPurchased } : {}),
    contentCard: createNovelContentCard(detail),
    contentAccess: createNovelContentAccess(detail),
  };
}

function listNovels(query?: RequestOptions["query"]): NovelListResponse {
  const categoryKey = coerceMockQueryString(query?.categoryKey);
  const status = coerceMockQueryString(query?.status);
  const keyword = coerceMockQueryString(query?.keyword) ?? "";
  const normalizedKeyword = keyword.toLowerCase();
  const sort = coerceMockQueryString(query?.sort) ?? "recommended";
  const allCards = NOVELS.map(toNovelCard);
  let cards = [...allCards];

  if (categoryKey && categoryKey !== "all") {
    cards = cards.filter((item) => item.categoryKey === categoryKey);
  }
  if (status && status !== "all") {
    cards = cards.filter((item) => item.status === status);
  }
  if (normalizedKeyword) {
    cards = cards.filter((item) => [item.title, item.authorName, item.summary].some((value) => value.toLowerCase().includes(normalizedKeyword)));
  }
  if (sort === "updatedAt") {
    cards.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } else if (sort === "popular") {
    cards.sort((left, right) => (right.readingCount ?? 0) - (left.readingCount ?? 0));
  } else if (sort === "wordCount") {
    cards.sort((left, right) => right.wordCount - left.wordCount);
  }

  const pageData = paginateMockItems(cards, query, { defaultPageSize: 6 });
  const { items, page, pageSize, hasMore } = pageData;

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

function createBookshelf(): BookshelfResponse {
  return {
    items: [
      { novelId: "novel_lantern", title: "Ashes Of The Lantern", authorName: "Lin Yue", coverUrl: MOCK_COVER_URLS.lantern, latestChapterTitle: "Chapter 6 · The Ember Ledger", continueChapterId: "lantern_ch_03", continueChapterTitle: "Chapter 3 · Witness On The Water", progressPercent: 0.46, updatedAt: "2026-03-22T08:00:00.000Z", hasUpdate: true },
      { novelId: "novel_brocade", title: "Brocade Pavilion", authorName: "Qiao An", coverUrl: MOCK_COVER_URLS.brocade, latestChapterTitle: "Chapter 4 · The Final Stitch", continueChapterId: "brocade_ch_02", continueChapterTitle: "Chapter 2 · Gold Thread Accounts", progressPercent: 0.24, updatedAt: "2026-03-12T08:00:00.000Z", hasUpdate: false },
    ],
  };
}

export function createNovelWechatMockApiAdapter(): RequestAdapter {
  const progressByNovelId: Record<string, ReadingProgress> = {
    novel_lantern: { novelId: "novel_lantern", chapterId: "lantern_ch_03", chapterTitle: "Chapter 3 · Witness On The Water", progressPercent: 0.46, updatedAt: "2026-03-22T08:00:00.000Z" },
    novel_brocade: { novelId: "novel_brocade", chapterId: "brocade_ch_02", chapterTitle: "Chapter 2 · Gold Thread Accounts", progressPercent: 0.24, updatedAt: "2026-03-12T08:00:00.000Z" },
  };

  return {
    async request<T = unknown>(options: RequestOptions) {
      const pathname = resolveMockRequestPath(options.url);

      if (matchesMockRequestRoute(options, "/auth/login")) {
        return ok(createJsonMockResponse(200, {
          userId: "novel-wechat-user",
          accessToken: ACCESS_TOKEN,
          expiresAt: Date.now() + 60 * 60 * 1000,
          profile: { nickname: "Novel Builder" },
        } as T));
      }

      if (!ensureAuthorized(options)) {
        return ok(createJsonMockResponse(401, { code: "UNAUTHORIZED", message: "Novel session expired. Please sign in again." } as T));
      }

      if (matchesMockRequestRoute(options, "/novels")) {
        return ok(createJsonMockResponse(200, listNovels(options.query) as T));
      }
      if (matchesMockRequestRoute(options, "/novels/detail")) {
        const novelId = coerceMockQueryString(options.query?.novelId);
        const detail = NOVELS.find((item) => item.id === novelId);
        if (!detail) {
          return ok(createJsonMockResponse(404, { code: "NOT_FOUND" } as T));
        }
        return ok(createJsonMockResponse(200, detail as T));
      }
      if (matchesMockRequestRoute(options, "/chapters")) {
        const novelId = coerceMockQueryString(options.query?.novelId);
        const response = novelId ? CHAPTER_LISTS[novelId] : undefined;
        if (!response) {
          return ok(createJsonMockResponse(404, { code: "NOT_FOUND" } as T));
        }
        return ok(createJsonMockResponse(200, response as T));
      }
      if (matchesMockRequestRoute(options, "/chapters/content")) {
        const chapterId = coerceMockQueryString(options.query?.chapterId);
        const response = chapterId ? CHAPTER_CONTENT[chapterId] : undefined;
        if (!response) {
          return ok(createJsonMockResponse(404, { code: "NOT_FOUND" } as T));
        }
        return ok(createJsonMockResponse(200, response as T));
      }
      if (matchesMockRequestRoute(options, "/bookshelf")) {
        return ok(createJsonMockResponse(200, createBookshelf() as T));
      }
      if (matchesMockRequestRoute(options, "/membership")) {
        return ok(createJsonMockResponse(200, MEMBERSHIP_OVERVIEW as T));
      }
      if (matchesMockRequestRoute(options, "/reading-progress", "GET")) {
        const novelId = coerceMockQueryString(options.query?.novelId);
        const progress = novelId ? progressByNovelId[novelId] ?? null : null;
        const response: LoadReadingProgressResponse = { progress };
        return ok(createJsonMockResponse(200, response as T));
      }
      if (matchesMockRequestRoute(options, "/reading-progress", "POST")) {
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

        return ok(createJsonMockResponse(200, {
          saved: true,
          progress: { ...payload, updatedAt },
        } as T));
      }

      return fail(createMockRouteNotFoundError(pathname, "Novel WeChat mock route not found"));
    },
  };
}
