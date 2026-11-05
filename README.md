# Data Matrix Lab — Cocktail Room

Standalone experimental scanner and verifier for 29-character Kazakhstan tobacco Data Matrix labels.

## Current version

- `index.html` — v7 PWA with iPhone camera scanning, offline barcode decoding and official check UI
- `cloudflare-worker.js` — HTTPS relay to Naqty Onim `POST /api/v3/check`
- `diagnostics/` — results of network and synthetic-code tests

## Publish Cloudflare Worker (required for verification)

1. Open https://dash.cloudflare.com/ and create a free account or sign in.
2. Open **Workers & Pages → Create application → Create Worker → Deploy**.
3. Open the created Worker, choose **Edit Code**, replace the default source with the COMPLETE content of `cloudflare-worker.js`, and **Deploy**.
4. Copy the Worker URL, such as `https://my-worker.my-account.workers.dev`.
5. Open Data Matrix Lab v7 on iPhone, paste that URL into **Адрес проверочного сервера**, and scan a real tobacco Data Matrix.
6. Press **Проверить подлинность**. Code is submitted only after pressing this button.

No keys required for the observed Naqty API call. The official API may change or restrict access. The Worker returns the actual API body. It does not record codes. In Cloudflare, disable any request/response body logging or traffic capture if enabled and restrict access/rate limits before wider production use.

## GitHub Pages deployment issue

GitHub Pages deploy jobs have previously failed on a stuck deployment. If the public Pages URL still serves an older version, access the specific main-branch commit via `https://raw.githack.com/issataevun-sys/datamatrix-lab1/<COMMIT_SHA>/index.html`.

## Limitations

- Official record presence/status does not establish that the physical label has not been cloned.
- Data Matrix decoding occurs locally; the ZXing library is loaded from CDN on first use.
- Product fields are displayed only when present in API JSON. If absent, no values are invented.
- This is an experimental consumer verification interface, not a production-grade integration or a report of product movement.
