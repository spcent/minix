const apiBaseUrl = process.env.MINIX_API_BASE_URL ?? "http://127.0.0.1:3000";

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const json = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed with ${response.status}: ${JSON.stringify(json)}`);
  }

  return json;
}

async function login(platform) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      platform,
      credential: platform === "wechat" ? { code: "wechat-code" } : { anonymousId: "host-h5-anonymous" },
    }),
  });
}

function withBearer(accessToken) {
  return {
    authorization: `Bearer ${accessToken}`,
  };
}

async function runHostH5Smoke() {
  const session = await login("h5");
  await request("/items?page=1&pageSize=2", { headers: withBearer(session.accessToken) });
  const refreshed = await request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      platform: "h5",
      refreshToken: session.refreshToken,
    }),
  });
  await request("/items?page=2&pageSize=2", { headers: withBearer(refreshed.accessToken) });
}

async function runHostWechatSmoke() {
  const session = await login("wechat");
  await request("/items?page=1&pageSize=3", { headers: withBearer(session.accessToken) });
}

async function runNovelH5Smoke() {
  const session = await login("h5");
  const headers = withBearer(session.accessToken);
  await request("/novels?sort=popular&page=1&pageSize=4", { headers });
  await request("/novels/detail?novelId=novel_lantern", { headers });
  await request("/chapters?novelId=novel_lantern", { headers });
  await request("/chapters/content?chapterId=lantern_ch_03", { headers });
  await request("/reading-progress", {
    method: "POST",
    headers,
    body: JSON.stringify({
      novelId: "novel_lantern",
      chapterId: "lantern_ch_04",
      progressPercent: 0.66,
      pageIndex: 4,
    }),
  });
  await request("/bookshelf", {
    method: "POST",
    headers,
    body: JSON.stringify({ novelId: "novel_glass" }),
  });
  await request("/membership/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      planId: "quarterly",
      source: "reader",
      novelId: "novel_brocade",
      chapterId: "brocade_ch_03",
    }),
  });
}

async function runNovelWechatSmoke() {
  const session = await login("wechat");
  const headers = withBearer(session.accessToken);
  await request("/novels?categoryKey=fantasy&page=1&pageSize=2", { headers });
  await request("/novels/detail?novelId=novel_brocade", { headers });
  await request("/chapters?novelId=novel_brocade", { headers });
  await request("/chapters/content?chapterId=brocade_ch_01", { headers });
  await request("/reading-progress?novelId=novel_brocade", { headers });
  await request("/membership", { headers });
}

async function main() {
  await request("/");
  await runHostH5Smoke();
  console.log("smoke passed: host-h5");
  await runHostWechatSmoke();
  console.log("smoke passed: host-wechat");
  await runNovelH5Smoke();
  console.log("smoke passed: novel-h5");
  await runNovelWechatSmoke();
  console.log("smoke passed: novel-wechat");
  console.log(`official sample smoke passed against ${apiBaseUrl}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
