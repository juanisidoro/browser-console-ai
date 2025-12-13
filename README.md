# Browser Console AI

Capture browser console logs and expose them to AI agents via MCP (Model Context Protocol).

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Chrome Extension│────▶│   MCP Server    │────▶│   Claude Code   │
│ (captures logs) │     │   (localhost)   │     │   (queries)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│    Frontend     │
│ (auth, billing) │
└─────────────────┘
```

## Project Structure

```
├── frontend/           # Next.js website (auth, payments, dashboard)
├── extension/
│   ├── chrome-extension/   # Manifest V3 extension
│   └── mcp-server/         # Node.js MCP server
├── shared/             # Shared business logic
└── docs/               # Documentation
```

## Quick Start

### 1. Install Dependencies

```bash
npm install  # Installs all workspaces
```

### 2. Run Frontend (Development)

```bash
npm run dev
# or
cd frontend && npm run dev
```

### 3. Run MCP Server

```bash
npm run mcp
# or
cd extension/mcp-server && npm start
```

### 4. Load Chrome Extension

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/chrome-extension/` folder

## Environment Setup

### Frontend (`frontend/.env.local`)

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_EARLY=price_...

# JWT
JWT_SECRET=...
```

## Deployment

### Frontend → Vercel

1. Connect repo to Vercel
2. Set Root Directory: `frontend`
3. Add environment variables
4. Deploy

### Chrome Extension → Chrome Web Store

1. Zip `extension/chrome-extension/` folder
2. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Submit for review

### MCP Server

Users run locally:
```bash
git clone https://github.com/YOUR_USERNAME/browser-console-ai
cd browser-console-ai/extension/mcp-server
npm install && npm start
```

## Plans

| Feature | FREE | PRO |
|---------|------|-----|
| Logs per recording | 100 | Unlimited |
| Recordings | 5 | Unlimited |
| MCP Integration | No | Yes |
| Export | No | Yes |

## License

MIT
