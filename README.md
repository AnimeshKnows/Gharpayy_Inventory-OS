# Gharpayy Inventory OS

Internal inventory and operations management system for Gharpayy — tracks properties, rooms, zones, leads, sales, and owner data.

## Stack

- **Backend** — Node.js + Express (ESM), MongoDB (Mongoose), JWT auth
- **Frontend** — Pre-built static files (Vite), served separately or via a CDN/static host

## Project Structure

```
Gharpayy-Inventory-Os/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Route handlers (admin, auth, leads, match, owner, rooms, sales, zones)
│   │   ├── middleware/     # JWT auth middleware
│   │   ├── models/         # Mongoose models (Action, Lead, Property, Room, User, Visit, Zone)
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Background jobs (xlsSync — CSV → DB sync)
│   │   └── index.js        # App entry point
│   ├── seed/
│   │   └── seedProperties.js   # One-time DB seeder from CSV
│   ├── data/
│   │   └── pg_extracted.csv    # Source data (gitignored)
│   └── package.json
└── Frontend/
    ├── assets/             # Bundled JS + CSS
    └── index.html          # Entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- A running MongoDB instance (Atlas or local)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (see `.env.example`):

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
XLS_FILE_PATH=./data/pg_extracted.csv

# CSV column mappings
COL_NAME=groupName
COL_AREA=area
COL_GENDER=gender
COL_SINGLE_PRICE=singlePrice
COL_DOUBLE_PRICE=doublePrice
COL_TRIPLE_PRICE=triplePrice
```

Start the server:

```bash
npm run dev      # development (nodemon)
npm start        # production
```

### Seed the Database

```bash
npm run seed
```

This reads `data/pg_extracted.csv` and populates the Properties collection.

### Frontend

The `Frontend/` folder is a pre-built static bundle. Serve it with any static host — Nginx, Vercel, Netlify, or locally:

```bash
npx serve Frontend
```

Point it to `VITE_API_URL=https://your-backend-url` if you need to configure the API base URL.

## API Routes

| Prefix         | Description             |
|----------------|-------------------------|
| `/api/auth`    | Login / register        |
| `/api/admin`   | Admin operations        |
| `/api/owner`   | Owner management        |
| `/api/leads`   | Lead tracking           |
| `/api/match`   | Property matching       |
| `/api/sales`   | Sales records           |
| `/api/zones`   | Zone management         |
| `/api/rooms`   | Room management         |

## Deployment

See the [Deployment Guide](#) section or refer to the deployment notes below.

### Backend → Render (recommended)

1. Push this repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Root Directory** to `backend`
4. Build command: `npm install`
5. Start command: `node src/index.js`
6. Add all environment variables from `.env` in the Render dashboard

### Frontend → Vercel / Netlify

Since the frontend is already built, just deploy the `Frontend/` folder as a static site.

**Vercel:**
```bash
cd Frontend
npx vercel --prod
```

**Netlify drag-and-drop:** Upload the `Frontend/` folder at [app.netlify.com/drop](https://app.netlify.com/drop).

## Environment Variables Reference

| Variable          | Required | Description                          |
|-------------------|----------|--------------------------------------|
| `MONGO_URI`       | ✅       | MongoDB Atlas connection string       |
| `PORT`            | ✅       | Server port (default 5000)           |
| `JWT_SECRET`      | ✅       | Secret for signing JWTs              |
| `XLS_FILE_PATH`   | optional | Path to CSV for xlsSync service      |
| `COL_*`           | optional | Column name mappings for CSV import  |

## Notes

- `backend/data/` is gitignored — do not commit the CSV (contains raw PG data)
- The `.env` file is gitignored — never commit credentials
- `xlsSync.js` runs as a background service on startup to keep DB in sync with the CSV
