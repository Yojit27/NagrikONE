# Testing Guide — Nagrik One

This document describes the testing strategy, test coverage, and execution instructions for Nagrik One.

---

## 1. Running the Automated Test Suite

We use [Vitest](https://vitest.dev/) as our primary testing framework.

```bash
# Run all tests once
npm test

# Run tests in watch mode during development
npx vitest

# Run a specific test suite
npx vitest run src/services/reportFirebaseService.test.ts
```

---

## 2. Test Coverage & Key Suites

### A. Data Integrity & Deletion Security (`src/services/reportFirebaseService.test.ts`)
- **Ownership Verification (`canUserDeleteReport`)**:
  - Confirms authorized deletion when authenticated citizen UID matches `report.authorUid`.
  - Blocks unauthorized deletion when an attacker's UID does not match `authorUid`.
  - Blocks deletion by unauthenticated or anonymous users (null/undefined UID).
  - Verifies legacy reports without `authorUid` can only be deleted if the authenticated user's email matches `reportedBy`.
- **Schema Normalization (`normalizeFirestoreReport`)**:
  - Verifies backward compatibility with legacy reports that only possess a single `imageUrl`.
  - Normalizes modern reports with multi-image arrays (`images` and `storagePaths`).
  - Provides safe fallbacks for missing fields (`upvotes`, `timeline`, `priority`, coordinates) to prevent UI crashes.
- **Image Validation (`validateImage`)**:
  - Approves standard images (JPEG, PNG, WebP) under 10MB.
  - Rejects oversized payloads (>10MB).
  - Rejects unsupported non-image formats (PDF, executables, documents).

### B. Six-Stage Municipal Escalation Logic (`src/utils/escalationLadder.test.ts`)
- **Stage 1**: Active public countdown within statutory Citizen Charter SLA window (12h to 72h).
- **Stage 2**: Automated reminder unlocked once SLA deadline is breached.
- **Stage 4**: Public social media tagging unlocked after 14 days of unresolved status.
- **Stage 5**: Section 6(1) Right to Information (RTI) application drafting unlocked after 21 days.
- **Stage 6**: Pro bono legal notice unlocked after RTI submission and statutory 30-day response window.
- **Resolved Invariant**: Halts all escalation ladders and marks all stages as completed/unnecessary once issue status is marked 'Resolved'.

### C. Geolocation & Proximity Engine (`src/utils/geo.test.ts`)
- **Haversine Distance**: Accurate geodesic distance calculations between coordinate points.
- **500m Duplicate Detection**: Tests filtering and sorting of nearby reports within a 500m radius to identify duplicate grievances and municipal hotspots.
- **Safety**: Safe handling of NaN, null, and non-finite coordinates.

---

## 3. Manual QA Verification Checklist

Before pushing code or tagging a release:
1. **Report Creation**:
   - Submit a report with 1, 2, and 3 photos.
   - Verify upload progress indicator displays active step ("Uploading photo 1 of 3...").
   - Verify report appears immediately in the Home feed and on the live GIS map.
2. **Report Deletion**:
   - Log in with the author account and confirm the Trash icon is visible.
   - Click "Retract Grievance / Delete Report" and confirm dialog appears.
   - Confirm deletion: report must be removed from Firestore and images from Firebase Storage.
   - Verify modal closes and report disappears from feed without refreshing the browser.
3. **Multi-Image Inspection**:
   - Open report details; inspect photo thumbnails.
   - Click each thumbnail to switch active image.
   - Click zoom icon to open full-resolution lightbox modal.
