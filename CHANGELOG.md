# Changelog — Nagrik One

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-20

### Added
- **Multi-Photo Evidence Upload**:
  - Citizens can attach up to 3 genuine on-site photographic evidence files per grievance.
  - Client-side format conversion to standard JPEG with EXIF orientation handling and 10MB file limit enforcement.
  - Direct binary upload to Firebase Storage with unique collision-resistant paths (`reports/{reportId}/{timestamp}_{index}.jpg`).
  - Automatic rollback of uploaded Storage objects if Firestore document creation fails, preventing orphaned storage bloat.
- **Permanent Grievance Retraction & Deletion**:
  - Delete actions on Home feed cards and comprehensive Issue Inspection modal for report owners.
  - Two-step confirmation modal with clear explanation of database removal, Storage cleanup, and escalation timer cessation.
  - Server-enforced Firestore rules (`request.auth.uid == resource.data.authorUid`) preventing IDOR attacks.
  - Real-time synchronization: deleted reports are immediately removed from feeds and active modals on all devices without resurrecting from stale state.
- **Six-Stage Municipal Escalation Ladder**:
  - Stage 1: Public Citizen Charter SLA countdown (12h to 72h).
  - Stage 2: Automated department reminder email generator and gateway dispatch.
  - Stage 3: Senior Officer escalation memorandum to Ward Officers and Municipal Commissioners.
  - Stage 4: Public social tagging on verified municipal channels.
  - Stage 5: Statutory inquiry drafting under Section 6(1) of the Right to Information Act, 2005.
  - Stage 6: Empaneled pro bono legal notice consultation under Section 80 CPC.
- **Automated Test Suite**:
  - Vitest test runner integrated with 22 unit tests covering data integrity, deletion security, escalation ladder logic, and Haversine geolocation.
- **Comprehensive Documentation**:
  - Added `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `TESTING.md`.

### Fixed
- Fixed bug where deleted Firestore reports resurrected in UI due to merging with previous local state in real-time listener.
- Fixed missing `ShieldCheck` icon import in `ReportDetailModal.tsx`.
- Fixed omission of `photos` array in report submission handler.
- Fixed open detail modal persisting after underlying report was deleted concurrently.
- Fixed close button being interactive during active file uploads in `ReportModal.tsx`.

### Security
- Hardened `firestore.rules` to strictly enforce `request.auth.uid == resource.data.authorUid` for document deletions and updates.
- Configured `storage.rules` with 10MB size limit and `image/*` MIME type verification.
- Verified zero secret leakage in tracked repository files and git configuration.
