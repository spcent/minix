# API App

Path: `apps/api`

Use this app for:

- the sample backend used by all official H5 and WeChat hosts
- contract-backed HTTP routes such as auth, items, settings, account, content, payment, and share flows
- local Node development and Cloudflare Worker deployment entry points
- D1-backed persistence, sample assets, and release verification surfaces

Keep the API structure explicit:

- `app.ts` owns top-level app creation and middleware only
- `app-composition*.ts` owns route-group and security assembly
- `http/*` owns shared HTTP parsing and response helpers
- `domains/*` owns business route slices and schemas

Do not collapse new behavior back into a monolithic `app.ts` or a single catch-all route file.
