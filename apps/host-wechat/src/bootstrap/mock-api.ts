import {
  coerceMockQueryNumber,
  createError,
  createJsonMockResponse,
  fail,
  ok,
  resolveMockRequestPath,
  type RequestAdapter,
  type RequestOptions,
} from "@minix/core";

interface HostMockItem {
  id: string;
  title: string;
  subtitle: string;
  categoryLabel?: string;
  difficultyLabel?: string;
  recommendedReason?: string;
  durationMinutes?: number;
}

const HOST_ITEMS: HostMockItem[] = [
  {
    id: "lesson_1",
    title: "Warm-up Vocabulary",
    subtitle: "8 travel words for airport check-in and hotel arrival",
    categoryLabel: "Warm-up",
    difficultyLabel: "A2",
    recommendedReason: "Start here to unlock the core words used by the rest of today's lesson.",
    durationMinutes: 2,
  },
  {
    id: "lesson_2",
    title: "Input Dialogue",
    subtitle: "Read a short airport check-in exchange and notice the key phrases",
    categoryLabel: "Input",
    difficultyLabel: "A2",
    recommendedReason: "Use the new vocabulary inside a real mini-dialogue before moving into active practice.",
    durationMinutes: 2,
  },
  {
    id: "lesson_3",
    title: "Guided Practice",
    subtitle: "Rebuild 3 short travel sentences with the lesson phrases",
    categoryLabel: "Practice",
    difficultyLabel: "A2-B1",
    recommendedReason: "This step turns passive input into active recall before you start speaking.",
    durationMinutes: 2,
  },
  {
    id: "lesson_4",
    title: "Speak Out Loud",
    subtitle: "Repeat 5 travel lines and practice natural rhythm out loud",
    categoryLabel: "Speaking",
    difficultyLabel: "B1",
    recommendedReason: "Now turn the lesson into spoken output while the sentence patterns are still fresh.",
    durationMinutes: 2,
  },
  {
    id: "lesson_5",
    title: "Wrap-up Review",
    subtitle: "Fix 2 mistakes, review the key phrase, and close the lesson cleanly",
    categoryLabel: "Wrap-up",
    difficultyLabel: "A2",
    recommendedReason: "Finish here so the lesson ends with one clear correction and one reusable phrase.",
    durationMinutes: 1,
  },
];

function listItems(query?: RequestOptions["query"]) {
  const page = coerceMockQueryNumber(query?.page, 1);
  const pageSize = coerceMockQueryNumber(query?.pageSize, 2);
  const start = (page - 1) * pageSize;
  const items = HOST_ITEMS.slice(start, start + pageSize);

  return {
    items,
    page,
    pageSize,
    hasMore: start + pageSize < HOST_ITEMS.length,
  };
}

export function createHostWechatMockApiAdapter(): RequestAdapter {
  return {
    async request<T = unknown>(options: RequestOptions) {
      const pathname = resolveMockRequestPath(options.url);

      if (pathname === "/auth/login") {
        const body = (options.body ?? {}) as {
          credential?: { code?: string };
          platform?: string;
        };

        if (!body.credential?.code && body.platform !== "h5") {
          return fail(
            createError("LOGIN_FAILED", "Mock login requires a platform code", {
              recoverable: true,
            }),
          );
        }

        return ok(
          createJsonMockResponse(200, {
            userId: "host-user",
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
            expiresAt: Date.now() + 60 * 60 * 1000,
            profile: {
              nickname: "Mia",
              avatarUrl: "https://mock.minix.local/avatar.png",
            },
          } as T),
        );
      }

      if (pathname === "/items") {
        const authHeader = options.headers?.Authorization;
        if (authHeader !== "Bearer mock-access-token") {
          return ok(
            createJsonMockResponse(401, {
              code: "UNAUTHORIZED",
              message: "Your learning session expired. Please sign in again.",
            } as T),
          );
        }

        return ok(createJsonMockResponse(200, listItems(options.query) as T));
      }

      return fail(
        createError("NOT_FOUND", `Mock route not found: ${pathname}`, {
          recoverable: true,
        }),
      );
    },
  };
}
