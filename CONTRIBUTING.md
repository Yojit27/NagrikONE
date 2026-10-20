# Contributing to Nagrik One

Thank you for your interest in contributing to Nagrik One! We welcome contributions from developers, civic advocates, and designers committed to improving municipal accountability in India.

---

## 1. Code of Conduct

Please maintain a collaborative, respectful, and constructive environment. Harassment or discriminatory behavior will not be tolerated.

---

## 2. Development Setup

### Prerequisites
- Node.js 18+ or 20+
- npm or bun

### Local Setup
```bash
# Clone the repository
git clone https://github.com/your-username/nagrik-one.git
cd nagrik-one

# Install dependencies
npm install

# Start local full-stack server
npm run dev
```

---

## 3. Contribution Workflow

1. **Fork & Branch**: Create a feature branch with a descriptive name (e.g. `feat/pothole-severity-filter` or `fix/image-upload-retry`).
2. **Adhere to Code Standards**:
   - Write strict TypeScript with explicit types where appropriate.
   - Use Tailwind CSS utility classes; avoid inline styles.
   - Keep components modular and focused.
3. **Run Verification & Tests**:
   ```bash
   # Run TypeScript compilation check
   npm run lint

   # Run automated test suite
   npm test

   # Run production build
   npm run build
   ```
4. **Submit a Pull Request**: Include a concise description of changes, screenshots for UI modifications, and reference any relevant issue numbers.

---

## 4. Architectural Rules

- **Zero Client Trust for Permissions**: Never rely solely on frontend state for security boundaries. Ensure Cloud Firestore and Firebase Storage rules enforce access control.
- **No Direct Secrets in Client**: All third-party AI keys (Gemini, TinyFish) or SMTP credentials must remain in `server.ts` server-side proxy routes.
- **Evidence Persistence**: Never store temporary base64 strings or `blob:` URLs in production Firestore report records. Use genuine Firebase Storage binary uploads.
