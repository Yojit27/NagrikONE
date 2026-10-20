# Nagrik One — AI-Powered Citizen Civic Reporting & Governance Platform

Nagrik One is a production-grade, citizen-centric civic governance application built for Indian municipalities and urban governance bodies. It empowers citizens to report hyper-local civic infrastructure grievances (potholes, garbage, waterlogging, streetlights, drainage), automatically routes complaints to responsible municipal departments with statutory Citizen Charter SLAs, and enforces transparency through a six-stage public accountability escalation ladder.

---

## Key Features

### 1. Robust Grievance Submission with Multi-Photo Evidence
- **Multi-Photo Evidence Upload**: Citizens can attach up to 3 genuine on-site photographic evidence files per report.
- **Client-Side Validation & Auto-Conversion**: Images are validated for format and size, automatically converted to high-quality standard JPEGs, and stripped of corrupted headers.
- **Direct Firebase Storage Persistence**: Evidence photos are uploaded as real binary blobs into dedicated Firebase Storage paths (`reports/{reportId}/{timestamp}_{index}.jpg`). No ephemeral base64 or temporary `blob:` URLs in production records.
- **Atomic Rollback on Partial Failures**: If network interruption or database errors occur after image upload, uploaded Storage objects are safely rolled back to prevent orphaned storage bloat.

### 2. Real-Time Cloud Firestore Data Synchronization
- **Live Municipal Feed**: Uses real-time snapshot listeners to instantly reflect newly submitted civic issues, upvotes, and status changes across devices without manual page reloads.
- **500-Meter Duplicate Detection**: Automatically calculates Haversine distance from existing grievances in the same municipal category to prevent duplicate work orders and flag recurring hotspots.
- **Offline & Fallback Resilience**: Implements graceful image skeleton loaders, retry states, and fallback icons if photos are slow to load or temporarily unreachable.

### 3. Retraction & Report Deletion
- **Secure Report Deletion**: Citizens can permanently retract grievances they authored directly from the Home feed or the Issue Detail modal.
- **Two-Step Confirmation**: Explains permanent actions (database removal, Firebase Storage evidence cleanup, halting of escalation ladders) before confirmation.
- **Server-Enforced Ownership**: Protected by Cloud Firestore security rules (`request.auth.uid == resource.data.authorUid`) preventing unauthorized deletions.

### 4. Six-Stage Municipal Escalation Ladder
When departments fail to remediate issues within their Citizen Charter SLAs:
1. **Stage 1 (Public Countdown)**: Live countdown tracking statutory resolution hours (12h to 72h).
2. **Stage 2 (Automated Reminder)**: Courteous reminder emails dispatched to municipal executive engineers.
3. **Stage 3 (Senior Officer Escalation)**: Formal administrative memorandum submitted to Ward Officers and Municipal Commissioners.
4. **Stage 4 (Public Social Tagging)**: Factual public awareness posts tagging verified municipal handles (X/Twitter, LinkedIn).
5. **Stage 5 (RTI Application Engine)**: Statutory inquiry drafted under Section 6(1) of the Right to Information Act, 2005.
6. **Stage 6 (Pro Bono Legal Action)**: Section 80 CPC statutory notice and legal panel review via empaneled advocates.

### 5. Multimodal AI & Geolocation
- **Gemini Multimodal Triage**: Evaluates photo authenticity, assesses structural severity on a 1-10 scale, and detects immediate safety hazards.
- **Voice-to-Text Dictation**: Multi-language speech recognition for accessibility across diverse citizen demographics.
- **Interactive Google Maps**: Color-coded markers, cluster pins, SLA countdown badges, and nearby grievance radiuses.
- **Civic Karma & Gamification**: Badges (First Responder, Road Guardian, Sanitation Sentinel, RTI Advocate) and karma points to reward active civic participation.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti
- **Mapping**: Google Maps Platform JavaScript API (`@googlemaps/js-api-loader`)
- **Backend & Server**: Node.js, Express (`server.ts`), tsx
- **Database & Auth**: Google Cloud Firestore, Firebase Authentication
- **Object Storage**: Google Firebase Storage
- **AI / Multimodal**: Google Gen AI SDK (`@google/genai`, Gemini 2.5 Flash)
- **Tooling & Build**: Vite, TypeScript (`tsc --noEmit`), ESLint

---

## Security & Access Control

- **Default-Deny Security Model**: Cloud Firestore rules strictly deny access by default, opening read access only to public civic reports and restricting write/delete operations to verified record authors.
- **Storage Rules**: Firebase Storage rules (`storage.rules`) restrict uploads to authenticated users, enforce image MIME types (`image/*`), and cap file sizes at 10 MB per photo.
- **No Client Secrets**: API keys and backend secrets are handled server-side or scoped strictly for client-side map rendering.

---

## Project Structure

```
├── firebase-applet-config.json  # Firebase client configuration
├── firestore.rules              # Cloud Firestore security rules
├── storage.rules                # Firebase Storage security rules
├── server.ts                    # Express API server & proxy routes
├── src/
│   ├── components/              # Modular UI components
│   │   ├── FeedView.tsx         # Home feed with live report cards
│   │   ├── ReportModal.tsx      # Grievance reporting form with multi-image upload
│   │   ├── ReportDetailModal.tsx# Comprehensive ticket tracking & evidence gallery
│   │   ├── DeleteConfirmationModal.tsx # Permanent deletion confirmation dialog
│   │   ├── CivicMap.tsx         # Google Maps interactive GIS layer
│   │   └── ...
│   ├── services/
│   │   ├── reportFirebaseService.ts # Firestore & Firebase Storage integration
│   │   └── geminiService.ts     # AI severity triage & photo inspection
│   ├── utils/
│   │   ├── escalationLadder.ts  # 6-stage escalation rules engine
│   │   ├── imageConverter.ts    # JPEG conversion and blob formatting
│   │   └── haversine.ts         # Geolocation distance calculation
│   └── types.ts                 # Full TypeScript schemas
```

---

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/nagrik-one.git
cd nagrik-one

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be live at `http://localhost:3000`.

### Building for Production
```bash
# Type check and build bundle
npm run build

# Start production server
npm start
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
