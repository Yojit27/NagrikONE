# Security Policy — Nagrik One

## 1. Security Overview

Nagrik One is designed with a defense-in-depth, zero-trust architecture. Security is enforced primarily at the cloud infrastructure layer via Google Cloud Firestore security rules and Firebase Storage security rules, rather than relying solely on client-side state or frontend validation.

---

## 2. Access Control Model

### Authentication & Identification
- **Firebase Authentication**: Backed by Google Sign-In and Email/Password with mandatory email verification before filing civic grievances.
- **Trusted Ownership**: When a citizen creates a report, `authorUid` is bound to `request.auth.uid`.
- **Insecure Direct Object Reference (IDOR) Mitigation**: Deletion and update operations strictly require `request.auth.uid == resource.data.authorUid`. Users cannot delete or alter other citizens' grievances by spoofing report IDs or URL parameters.

### Cloud Firestore Rules (`firestore.rules`)
- **Default-Deny Catch-All**: `match /{document=**} { allow read, write: if false; }` prevents exposure of unspecified collections.
- **Public Civic Data**: Reports collection permits public read (`allow get, list: if true`) so that citizens can track municipal transparency, SLA countdowns, and community upvotes.
- **Restricted Mutations**:
  - `create`: Enforces authentication (`isSignedIn()`), valid ID format (`isValidId()`), and verified author UID matching `request.auth.uid`.
  - `update`: Strictly partitioned. Only the report author can update report metadata, while public citizens can only increment the `upvotes` counter via atomic diff keys check (`request.resource.data.diff(resource.data).affectedKeys().hasOnly(['upvotes', 'updatedAt'])`).
  - `delete`: Server-enforced ownership. Only `request.auth.uid == resource.data.authorUid` (or matching verified email for legacy records) is permitted to delete documents.
- **User Profiles (`/users/{userId}`)**: PII isolation. Only the account owner can read or write their own user profile document. Listing user profiles is strictly disallowed (`allow list: if false`).

### Firebase Storage Rules (`storage.rules`)
- **Evidence Images (`/reports/{reportId}/{fileName}`)**:
  - `read`: Publicly accessible for legitimate civic feed and map inspection.
  - `write`: Restricted to authenticated users, capped at a maximum of 10MB per photo (`request.resource.size <= 10 * 1024 * 1024`), and strictly limited to image content types (`request.resource.contentType.matches('image/.*')`).
  - `delete`: Restricted to authenticated users owning the photo metadata.

---

## 3. Secret Management & GitHub Release Safety

- **No Secrets in Frontend Bundles**: Server-only credentials (`GEMINI_API_KEY`, `TINYFISH_API_KEY`, `SMTP_PASS`) are accessed strictly inside `server.ts` proxy endpoints. They are never exported or prefixed with `VITE_`.
- **Google Maps API Key**: The public Google Maps API key (`VITE_GOOGLE_MAPS_API_KEY`) is scoped for client-side map rendering only.
- **Git Hygiene**: `.env` and sensitive local files are excluded in `.gitignore`. Only `.env.example` containing dummy placeholders is tracked.

---

## 4. Reporting a Vulnerability

If you discover a security vulnerability in Nagrik One:
1. Do not open a public GitHub issue.
2. Please submit a private report to `security@nagrikone.gov.in` with the subject line `[SECURITY] Nagrik One Vulnerability Report`.
3. Provide a clear description, reproduction steps, and potential impact.
4. We aim to acknowledge receipt within 48 hours and provide remediation updates.
