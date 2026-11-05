# Reverse-engineering notes for NAQTY ONIM 3.0.1

Static analysis of user-provided APK `classes3.dex`:

- `ServerApiService.check(CheckData)`: `POST /api/v3/check`; parameter annotated `@Body`
- `ServerApiService.check(String, boolean)`: `GET /mobile/check/barcode`; parameter names `gtin`, `isScanner`
- `CheckData` contains `code`, `rawCode`, `group01`, `group21`, `codeType`, `category`, `mode`, `sid`, `userId`, `isGs1DataCarrier`, `persistScanResult`.
- Direct HTTPS POST with an invalid synthetic marker: HTTP 400 `method_argument_not_valid`.
- CORS preflight from Pages origin: HTTP 403.
- No official verification result obtained. Unknown: exact request field values and whether authentication/session is required.
- Do not publish genuine scanned markers in repository, logs or public workflows.

## Caller confirmation

`ScanFragmentPresenter.checkCode(CheckData)` invokes `SharedPrefs.getAccessToken()` and constructs `ApiModule.getInstance(...)` before invoking `ServerApiService.check(CheckData)`. Thus the mobile application's network layer is configured with an access-token value even for this scanner flow. It remains unknown whether a guest/session token is established automatically or an empty token is allowed. Do not claim the POST API is anonymously accessible solely because its HTTP endpoint responds with validation errors.

`ScanFragmentPresenter.checkBarcode(...)` also consults the access token. The helper `getCheckData(...)` sets mode and barcode-type hints; observed literal `ean_13` applies to barcode flow, not yet established for tobacco Data Matrix.
