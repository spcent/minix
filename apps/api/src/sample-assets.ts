import type { LoginProfile } from "./types";
import { escapeXml } from "./http/response";

type SampleCoverAssetId =
  | "novel-lantern"
  | "novel-brocade"
  | "novel-sword"
  | "novel-orchid"
  | "novel-glass";

type SampleProfileAssetId = "minix-user";

interface CoverPalette {
  backgroundStart: string;
  backgroundEnd: string;
  accent: string;
  text: string;
}

const COVER_ASSETS: Record<SampleCoverAssetId, { eyebrow: string; title: string; subtitle: string; palette: CoverPalette }> = {
  "novel-lantern": {
    eyebrow: "Canal Mystery",
    title: "Ashes Of\nThe Lantern",
    subtitle: "Rain-soaked noir and witness ledgers",
    palette: {
      backgroundStart: "#0f1d2f",
      backgroundEnd: "#314a5f",
      accent: "#f4b860",
      text: "#f4efe6",
    },
  },
  "novel-brocade": {
    eyebrow: "Court Intrigue",
    title: "Brocade\nPavilion",
    subtitle: "Silk, debt, and inherited names",
    palette: {
      backgroundStart: "#401321",
      backgroundEnd: "#854459",
      accent: "#f0c987",
      text: "#fff4eb",
    },
  },
  "novel-sword": {
    eyebrow: "Road Wuxia",
    title: "Sword Before\nDawn",
    subtitle: "An oath held against three provinces",
    palette: {
      backgroundStart: "#142027",
      backgroundEnd: "#44606d",
      accent: "#d8e6ef",
      text: "#f7fafc",
    },
  },
  "novel-orchid": {
    eyebrow: "Merchant Mystery",
    title: "Orchid\nLedger",
    subtitle: "Guild pressure and a surviving account book",
    palette: {
      backgroundStart: "#1f3125",
      backgroundEnd: "#5d7e55",
      accent: "#d7d69f",
      text: "#f4f8ef",
    },
  },
  "novel-glass": {
    eyebrow: "Coastal Fantasy",
    title: "Glass\nHarbor",
    subtitle: "Saints, tariffs, and weather cults",
    palette: {
      backgroundStart: "#10283a",
      backgroundEnd: "#4a84a1",
      accent: "#f6ddb1",
      text: "#f5fbff",
    },
  },
};

const PROFILE_ASSETS: Record<SampleProfileAssetId, { initials: string; background: string; accent: string; text: string }> =
  {
    "minix-user": {
      initials: "MX",
      background: "#173249",
      accent: "#f2c572",
      text: "#f8f4ed",
    },
  };

function buildMultilineTextLines(text: string) {
  return text.split("\n").map((line) => escapeXml(line));
}

function createCoverSvg(assetId: SampleCoverAssetId): string {
  const asset = COVER_ASSETS[assetId];
  const titleLines = buildMultilineTextLines(asset.title);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080" role="img" aria-label="${escapeXml(asset.title.replaceAll("\n", " "))} cover">`,
    "<defs>",
    `  <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">`,
    `    <stop offset="0%" stop-color="${asset.palette.backgroundStart}"/>`,
    `    <stop offset="100%" stop-color="${asset.palette.backgroundEnd}"/>`,
    "  </linearGradient>",
    "</defs>",
    `  <rect width="720" height="1080" fill="url(#bg)"/>`,
    `  <circle cx="565" cy="214" r="124" fill="${asset.palette.accent}" fill-opacity="0.12"/>`,
    `  <circle cx="158" cy="850" r="172" fill="${asset.palette.accent}" fill-opacity="0.1"/>`,
    `  <rect x="74" y="86" width="572" height="908" rx="28" fill="none" stroke="${asset.palette.accent}" stroke-opacity="0.45"/>`,
    `  <text x="104" y="176" font-size="34" font-family="Georgia, 'Times New Roman', serif" letter-spacing="5" fill="${asset.palette.accent}">${escapeXml(asset.eyebrow.toUpperCase())}</text>`,
    ...titleLines.map(
      (line, index) =>
        `  <text x="104" y="${index === 0 ? 356 : 446}" font-size="92" font-weight="700" font-family="Georgia, 'Times New Roman', serif" fill="${asset.palette.text}">${line}</text>`,
    ),
    `  <path d="M104 520 C208 470, 308 468, 416 508 C498 538, 564 544, 624 520" fill="none" stroke="${asset.palette.accent}" stroke-width="6" stroke-linecap="round" stroke-opacity="0.75"/>`,
    `  <text x="104" y="620" font-size="38" font-family="'Helvetica Neue', Arial, sans-serif" fill="${asset.palette.text}" fill-opacity="0.92">${escapeXml(asset.subtitle)}</text>`,
    `  <text x="104" y="944" font-size="28" font-family="'Helvetica Neue', Arial, sans-serif" letter-spacing="6" fill="${asset.palette.accent}">MINIX OFFICIAL SAMPLE</text>`,
    "</svg>",
  ].join("");
}

function createProfileSvg(assetId: SampleProfileAssetId): string {
  const asset = PROFILE_ASSETS[assetId];

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="MiniX user avatar">`,
    `  <rect width="256" height="256" rx="128" fill="${asset.background}"/>`,
    `  <circle cx="128" cy="128" r="92" fill="${asset.accent}" fill-opacity="0.14"/>`,
    `  <circle cx="128" cy="106" r="34" fill="${asset.accent}" fill-opacity="0.9"/>`,
    `  <path d="M70 194 C82 156, 111 138, 128 138 C145 138, 174 156, 186 194" fill="${asset.accent}" fill-opacity="0.88"/>`,
    `  <text x="128" y="230" text-anchor="middle" font-size="32" font-weight="700" font-family="'Helvetica Neue', Arial, sans-serif" fill="${asset.text}">${escapeXml(asset.initials)}</text>`,
    "</svg>",
  ].join("");
}

export function buildSampleCoverAssetPath(assetId: SampleCoverAssetId): string {
  return `/sample-assets/covers/${assetId}.svg`;
}

export function buildSampleProfileAssetPath(assetId: SampleProfileAssetId): string {
  return `/sample-assets/profiles/${assetId}.svg`;
}

export function renderSampleCoverAssetSvg(assetId: string): string | null {
  if (!(assetId in COVER_ASSETS)) {
    return null;
  }

  return createCoverSvg(assetId as SampleCoverAssetId);
}

export function renderSampleProfileAssetSvg(assetId: string): string | null {
  if (!(assetId in PROFILE_ASSETS)) {
    return null;
  }

  return createProfileSvg(assetId as SampleProfileAssetId);
}

export function renderSharePosterSvg(input: {
  title: string;
  summary?: string;
  inviteCode?: string;
  channelLabel?: string;
  shortCode: string;
}): string {
  const title = escapeXml(input.title);
  const summary = escapeXml(input.summary ?? "Open MiniX and continue through the shared growth flow.");
  const inviteCode = escapeXml(input.inviteCode ?? "MINIX");
  const channelLabel = escapeXml((input.channelLabel ?? "Share").toUpperCase());
  const shortCode = escapeXml(input.shortCode.toUpperCase());

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1440" viewBox="0 0 960 1440" role="img" aria-label="${title} poster">`,
    "<defs>",
    `  <linearGradient id="posterBg" x1="0%" y1="0%" x2="100%" y2="100%">`,
    `    <stop offset="0%" stop-color="#16324a"/>`,
    `    <stop offset="100%" stop-color="#335d74"/>`,
    "  </linearGradient>",
    "</defs>",
    `  <rect width="960" height="1440" fill="url(#posterBg)"/>`,
    `  <circle cx="760" cy="280" r="170" fill="#f2c572" fill-opacity="0.12"/>`,
    `  <circle cx="250" cy="1110" r="220" fill="#f2c572" fill-opacity="0.1"/>`,
    `  <rect x="72" y="72" width="816" height="1296" rx="36" fill="none" stroke="#f2c572" stroke-opacity="0.45" stroke-width="3"/>`,
    `  <text x="112" y="170" font-size="34" font-family="'Helvetica Neue', Arial, sans-serif" letter-spacing="8" fill="#f2c572">${channelLabel}</text>`,
    `  <text x="112" y="330" font-size="92" font-family="Georgia, 'Times New Roman', serif" font-weight="700" fill="#f8f4ed">${title}</text>`,
    `  <text x="112" y="430" font-size="34" font-family="'Helvetica Neue', Arial, sans-serif" fill="#f8f4ed" fill-opacity="0.92">${summary}</text>`,
    `  <rect x="112" y="548" width="736" height="420" rx="30" fill="#f8f4ed" fill-opacity="0.08" stroke="#f8f4ed" stroke-opacity="0.16"/>`,
    `  <text x="480" y="720" text-anchor="middle" font-size="48" font-family="'Helvetica Neue', Arial, sans-serif" fill="#f8f4ed">Invite Code</text>`,
    `  <text x="480" y="810" text-anchor="middle" font-size="88" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="700" letter-spacing="10" fill="#f2c572">${inviteCode}</text>`,
    `  <text x="480" y="910" text-anchor="middle" font-size="30" font-family="'Helvetica Neue', Arial, sans-serif" fill="#f8f4ed" fill-opacity="0.82">Short code ${shortCode}</text>`,
    `  <text x="112" y="1200" font-size="32" font-family="'Helvetica Neue', Arial, sans-serif" fill="#f8f4ed">Scan or open the short link to attribute click, return, and conversion.</text>`,
    `  <text x="112" y="1290" font-size="28" font-family="'Helvetica Neue', Arial, sans-serif" letter-spacing="6" fill="#f2c572">MINIX SHARE POSTER SAMPLE</text>`,
    "</svg>",
  ].join("");
}

export function resolveSampleMediaUrl(value: string | undefined, requestUrl: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new URL(value, requestUrl).toString();
}

export function resolveProfileMedia(profile: LoginProfile, requestUrl: string): LoginProfile {
  const avatarUrl = profile.avatarUrl ? resolveSampleMediaUrl(profile.avatarUrl, requestUrl) : undefined;

  return {
    ...profile,
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}
