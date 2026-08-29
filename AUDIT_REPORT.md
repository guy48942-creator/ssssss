# AUDIT_REPORT — ANAS Accounting Web Application

## 1. Project Architecture

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4.
- **UI:** Componentized tabs for Dashboard, Accounts, Ledger, Invoices, Reports, Sync/Import, Gateway, AI Control, Backup, Recycle Bin and Activity Log.
- **State:** Local `Database` class backed by LocalStorage, with Firestore synchronization.
- **Authentication:** Firebase Authentication with Google sign-in.
- **Cloud data:** Firestore user database + encrypted backup subcollection.
- **AI backend:** Express server routes `/api/parse-document` and `/api/ai-control` using `@google/genai`.
- **PWA:** `vite-plugin-pwa` service-worker registration and install flow.
- **Assets:** Public icons plus application image assets.

## 2. Errors / Risks Found

### High priority
1. The floating calculator used `new Function()` to evaluate expressions.
2. Gateway API credentials were hard-coded in the frontend default configuration.
3. Gateway provider URLs were placeholder values and could be persisted as if they were real integrations.
4. Firestore synchronization used two incompatible document shapes: the main app expected `dbState`, while Sync/Import wrote top-level `accounts`, `transactions`, and `dailyEntries`.
5. Sync/Import attempted to write `user_backups/{uid}` while Firestore rules only authorized `user_backups/{uid}/backups_store/{backupId}`.
6. The AI endpoints accepted large unauthenticated payloads with no application-level rate limit.
7. AI-control prompt instructions were concatenated into the user message instead of being separated as system instructions.
8. Oversized backup documents could exceed practical Firestore document limits.
9. Some UI classes used non-standard Tailwind color scales such as `650`, `750`, `850`, etc., causing missing styles under the configured design system.
10. Two image references pointed at `/src/assets/...`, which is not a safe production public URL pattern for Vite-built assets.

### Medium priority
11. Backup integrity was hashed but the hash was not verified during restore.
12. Device/OS detection could classify iOS as macOS because of user-agent condition ordering.
13. The original project could not be fully linted/built in the audit environment because dependencies were not installed.

## 3. Root Causes

- Security shortcuts were embedded directly in client-side defaults.
- Cloud persistence contracts evolved independently in different components.
- The UI contained hand-authored Tailwind utility values outside the configured palette.
- Backend endpoints assumed trusted callers without request throttling or strict body validation.
- Backup storage was implemented twice with different Firestore paths and data models.
- The project archive did not include installed dependencies, and package installation timed out in the execution environment.

## 4. Fixes Applied

### Calculator
- Removed dynamic JavaScript evaluation.
- Added a bounded arithmetic parser supporting numbers, parentheses and `+ - * /`.
- Added division-by-zero, malformed-expression and finite-result checks.

### Gateway security
- Removed hard-coded default API keys.
- Added migration logic that clears previously persisted placeholder/legacy gateway credentials.
- Cleared known placeholder gateway endpoints from persisted configuration.

### Firestore synchronization
- Standardized `user_databases/{uid}` writes around:
  - `dbState`
  - `lastUpdated`
  - `updatedBy`
- Added backward-tolerant reading of legacy top-level collections.
- Updated Sync/Import to use `Database.exportState()` / `Database.importState()`.

### Cloud backups
- Unified Sync/Import backup persistence with `BackupService` and the authorized `backups_store` subcollection.
- Added `firebaseBackupId` tracking for restore/delete operations.
- Added backup size enforcement before Firestore writes.
- Added encrypted-backup hash verification during restore.
- Improved iOS/macOS user-agent detection order.
- Tightened Firestore encrypted payload limit.

### Backend / AI
- Reduced JSON/form body limits from 50 MB to 12 MB.
- Added payload size validation for document and text analysis.
- Added MIME-type allowlisting for document analysis.
- Added a lightweight per-IP AI request limiter: 20 requests/minute.
- Added `Retry-After` for HTTP 429 responses.
- Made the Gemini model configurable through `GEMINI_MODEL` and defaulted it to `gemini-3.7-flash`.
- Moved AI-control instructions into `systemInstruction` rather than mixing them into the user prompt.
- Prevented raw model/JSON parsing errors from being exposed as API error messages.
- Added structured-response parsing failure handling with HTTP 502.

### UI / 3D Design System
- Added a reusable premium 3D foundation:
  - perspective
  - surface depth
  - glass surfaces
  - controlled blur
  - layered shadows
  - depth hover states
  - dark-mode surface tokens
  - safe-area helpers
  - mobile 3D behavior
  - reduced-motion support
- Applied the 3D shell to the main application frame and desktop sidebar.
- Replaced invalid Tailwind color scales across affected components with supported palette values.
- Added `prefers-reduced-motion` handling.

### Assets
- Moved background images into `public/assets/images/` and updated runtime URLs so production builds can serve them reliably.

## 5. Backend Fixes

| Area | Result |
|---|---|
| Health endpoint | Present |
| Document API | Input limits + MIME validation + structured error handling |
| AI Control API | Rate limit + prompt validation + system instruction separation |
| HTTP 429 | Implemented for AI routes |
| HTTP 4xx validation | Improved |
| Secrets | Gemini key remains server-side via environment variable |
| Fake API generation | No fake API introduced |

## 6. UI/UX Changes

- Premium glass/depth surface foundation added globally.
- Main shell and sidebar upgraded with depth and translucency.
- Mobile safe-area support added.
- Reduced-motion accessibility support added.
- Invalid utility classes normalized so the design system can actually generate the intended CSS.
- Existing feature components were retained rather than removed.

## 7. 3D Design Changes

- `app-shell-3d`
- `surface-3d`
- `depth-panel-3d`
- improved `card-3d`
- controlled hover elevation rather than excessive rotation
- dark/light surface tokens
- responsive reduction of 3D transforms on small screens

## 8. Responsive Fixes

- Added safe-area utilities for mobile devices.
- Reduced heavy hover transforms on mobile.
- Added reduced-motion handling.
- Normalized invalid utility classes that could cause layout/style omissions.
- Existing responsive breakpoints remain intact.

## 9. Security Fixes

- Removed dynamic code execution from calculator.
- Removed hard-coded gateway credentials from defaults.
- Added migration that clears legacy placeholder credentials.
- Kept Gemini secret server-side.
- Added AI request throttling.
- Added request body limits.
- Added document MIME validation.
- Added backup integrity verification.
- No `eval()` or `new Function()` remains in application source.

## 10. Performance Improvements

- Reduced server request-body exposure from 50 MB to 12 MB.
- Added in-memory cleanup for AI rate-limit records.
- Retained existing debounce behavior for Firestore updates.
- Reduced 3D effects on mobile and under reduced-motion preferences.
- Avoided introducing heavy 3D libraries; the design system remains CSS-based.

## 11. Features Tested / Inspected

Static inspection covered:

- Project tree and architecture
- Relative imports
- JSON configuration parsing
- Local asset references
- Firestore path consistency
- Dangerous dynamic-code constructs
- Hard-coded gateway credential patterns
- Tailwind utility anomalies
- Backend route definitions
- Backup encryption/integrity flow
- Responsive/3D CSS foundations

## 12. Files Modified

- `.env.example`
- `firestore.rules`
- `server.ts`
- `src/App.tsx`
- `src/backupService.ts`
- `src/index.css`
- `src/utils.ts`
- `src/components/AIControlDashboard.tsx`
- `src/components/AccountsTab.tsx`
- `src/components/BackupCenterTab.tsx`
- `src/components/CurrencyModal.tsx`
- `src/components/DashboardTab.tsx`
- `src/components/FloatingCalculator.tsx`
- `src/components/GatewayTab.tsx`
- `src/components/InvoiceTab.tsx`
- `src/components/LedgerTab.tsx`
- `src/components/ReportsTab.tsx`
- `src/components/SyncImportTab.tsx`
- `public/assets/images/qat_leaves_background_1782572930062.jpg`
- `public/assets/images/qat_farm_background_1782572945221.jpg`
- `AUDIT_REPORT.md`

## 13. Tests Executed

### Static checks
- JSON parsing: executed.
- Relative-import existence scan: executed.
- Local public-asset scan: executed and corrected for the two background images.
- Dangerous-code scan: executed.
- Tailwind anomaly scan: executed and normalized across affected components.
- TypeScript parser-level scan with globally available TypeScript: executed; no syntax-error diagnostics were observed in the inspected source. Full type resolution was not possible without project dependencies.

### Project commands
- `npm run lint`: **NOT PASSING IN THIS ENVIRONMENT** because dependencies are absent; TypeScript reported missing `vite-plugin-pwa/client` types.
- `npm run build`: **NOT RUNNABLE IN THIS ENVIRONMENT** because `vite` is not installed.
- `npm install --no-audit --no-fund`: attempted, but dependency installation timed out before `node_modules` became available.

## 14. Test Results

| Test | Result |
|---|---|
| Static source inspection | PASS |
| Dangerous dynamic execution scan | PASS |
| Hard-coded gateway credential scan | PASS |
| Relative import scan | PASS |
| Public asset scan after repair | PASS |
| Firestore path consistency | PASS for repaired backup/sync paths |
| TypeScript full type-check | BLOCKED by missing dependencies |
| Vite production build | BLOCKED by missing dependencies |
| Browser Console verification | NOT EXECUTABLE in this environment |
| Browser Network verification | NOT EXECUTABLE in this environment |
| Real Firebase integration test | NOT EXECUTABLE without project credentials/network |
| Real Gemini request test | NOT EXECUTABLE without `GEMINI_API_KEY` |

## 15. Remaining Issues

1. A full `npm install` must complete in a network-enabled environment before claiming a clean `npm run lint` / `npm run build` result.
2. Browser-level testing at 320/360/375/390/412/430/768/820/1024/1280/1440/1920/2560 px remains to be executed with a real browser.
3. Real Firebase Auth/Firestore rules need an authenticated integration test.
4. Real Google Drive upload/restore needs a fresh OAuth session with the required Drive scopes.
5. Gateway WhatsApp/SMS integrations are intentionally not fabricated; real provider credentials and endpoints must be configured by the operator.
6. The backup encryption key is still derived client-side from the user ID. This provides obfuscation/encryption at rest for the current architecture but is not equivalent to a server-managed secret or KMS-backed key hierarchy.

## 16. Recommended Future Improvements

1. Add a CI job that runs `npm ci`, `npm run lint`, `npm run build`, and browser smoke tests.
2. Add Playwright end-to-end coverage for all major navigation and CRUD flows.
3. Add Firebase Emulator Suite tests for authentication and Firestore rules.
4. Move backup encryption to a server/KMS-backed key strategy for high-value financial data.
5. Add authenticated server-side authorization for AI endpoints rather than relying only on rate limiting.
6. Add centralized application logging/error monitoring.
7. Add schema validation for imported backup state before calling `Database.importState()`.
8. Add conflict-aware Firestore synchronization using version numbers or server timestamps instead of timestamp-string comparison alone.
9. Split oversized backup payloads or use object storage for large archives.
10. Continue migrating repeated UI patterns into reusable Button, Modal, Card, FormField and DataTable components.
