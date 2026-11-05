# Reverse-engineering notes for NAQTY ONIM 3.0.1

Static analysis of user-provided APK `classes3.dex`:

- `ServerApiService.check(CheckData)`: `POST /api/v3/check`; parameter annotated `@Body`
- `ServerApiService.check(String, boolean)`: `GET /mobile/check/barcode`; parameter names `gtin`, `isScanner`
- `CheckData` contains `code`, `rawCode`, `group01`, `group21`, `codeType`, `category`, `mode`, `sid`, `userId`, `isGs1DataCarrier`, `persistScanResult`.
- Direct HTTPS POST with an invalid synthetic marker: HTTP 400 `method_argument_not_valid`.
- CORS preflight from Pages origin: HTTP 403.
- No official verification result obtained. Unknown: exact request field values and whether authentication/session is required.
- Do not publish genuine scanned markers in repository, logs or public workflows.
