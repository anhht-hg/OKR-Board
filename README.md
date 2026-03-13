# OKR Board — HG Entertainment 2026

Internal OKR management dashboard for the Technology & Operations team.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · SQLite (Prisma 7) · Recharts

---

## ✨ Features

### 📊 Dashboard
- Real-time overview of all objectives, key results, and features
- Progress tracking with automated roll-up calculations
- Project health grid with status visualization
- Dual-track monitoring (strategic vs operational)

### 🎯 OKR Tree
- Hierarchical view: **Objectives → Key Results → Features**
- Drag-and-drop reordering with `@dnd-kit`
- Inline editing of all fields (title, status, dates, owner, etc.)
- Completion tracking with `completedAt` timestamps

### 📋 OKR Chi tiết (Detailed OKR View)
- Spreadsheet-style detailed view of all OKR items
- Filtering and sorting capabilities
- Strategic pillar linkage (corporate KR connections)

### 📅 Kế hoạch tháng (Monthly Action Plan) ← **NEW**
- **Section A — Monthly Goals**: 3–5 focused objectives with OKR linkage
- **Section B — Action Items**: Detailed task breakdown per goal with PiC, dates, status, budget, and KR linkage
- **Section C — KPI Tracking**: Monthly KPI targets vs actuals with percentage completion
- Multi-month plan management with tab navigation
- Full CRUD for all sections (Admin only)

### 🔐 Role-based Access

| Role | Access |
|------|--------|
| **Admin** | Full read/write — create, edit, change status |
| **Viewer** | Read-only — all write UI hidden, API mutations blocked |

Default admin credentials are set via environment variable (see below).

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── objectives/                 # OKR Tree view
│   ├── okr/                        # OKR detailed view
│   ├── action-plan/                # Monthly Action Plan
│   ├── login/                      # Auth page
│   └── api/
│       ├── items/                  # OKR CRUD endpoints
│       ├── objectives/             # Objective tree endpoints
│       ├── dashboard/              # Dashboard stats
│       ├── action-plans/           # Monthly plan CRUD
│       │   └── [planId]/
│       │       ├── goals/          # Goal CRUD + action-items
│       │       └── kpis/           # KPI CRUD
│       ├── auth/                   # Login/logout/session
│       └── search/                 # Global search
├── components/
│   ├── dashboard/                  # Dashboard widgets
│   ├── objectives/                 # OKR tree nodes
│   ├── action-plan/                # Monthly plan components
│   ├── layout/                     # Sidebar, shell
│   └── ui/                         # shadcn/ui primitives
├── hooks/                          # React Query hooks
├── lib/                            # Utilities (progress, dates, constants)
├── context/                        # AuthContext
└── types/                          # TypeScript interfaces
```

---

## 🚀 Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set ADMIN_PASSWORD
```

### 3. Restore the database
```bash
# Restore all OKR items from the committed SQL dump
chmod +x prisma/seed/restore-db.sh
./prisma/seed/restore-db.sh
```

### 4. Import Monthly Action Plan data (optional)
```bash
# Parse and import monthly plan from Google Sheets export
npx ts-node prisma/seed/import_monthly_plan.ts
```

### 5. Start dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Run tests
```bash
npm test
```

---

## 🏗️ Production Deployment (VPS + PM2)

### Requirements
- Node.js 22+
- nginx
- PM2 (`npm install -g pm2`)

### Steps

**1. Upload files to server**
```bash
rsync -av \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='*.db' \
  --exclude='.env' \
  ./ user@YOUR_SERVER:/var/www/okr-board/
```

**2. Restore the database on the server**
```bash
chmod +x prisma/seed/restore-db.sh
./prisma/seed/restore-db.sh
```

**3. On the server**
```bash
cd /var/www/okr-board
cp .env.example .env
# Edit .env — set a strong ADMIN_PASSWORD
npm install
npm run build
pm2 start npm --name okr-board -- start
pm2 save && pm2 startup
```

**4. nginx reverse proxy**
```nginx
server {
    listen 80;
    server_name okr.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

**5. Add SSL**
```bash
sudo certbot --nginx -d okr.yourdomain.com
```

---

## 🐳 Production Deployment (Docker)

```bash
# Build
docker build -t okr-board .

# Run (mount db as volume for persistence)
docker run -d \
  -p 3000:3000 \
  -e ADMIN_PASSWORD=your-strong-password \
  -e DATABASE_URL=file:./dev.db \
  -v /data/okr-board/dev.db:/app/dev.db \
  --name okr-board \
  --restart unless-stopped \
  okr-board
```

---

## 💾 Database

### Schema Overview

| Model | Description |
|-------|-------------|
| `OkrItem` | Hierarchical OKR items (Objective / Key Result / Feature) |
| `ActionPlan` | Monthly action plan container |
| `MonthlyGoal` | 3–5 focus goals per month |
| `ActionItem` | Individual tasks linked to goals |
| `KpiItem` | Monthly KPI metrics with target/actual tracking |

### Backup
The entire database is a single file: `dev.db`. Back it up regularly:

```bash
# Add to crontab: crontab -e
0 2 * * * cp /var/www/okr-board/dev.db /backup/okr-$(date +\%Y\%m\%d).db
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path, e.g. `file:./dev.db` |
| `ADMIN_PASSWORD` | Yes | Password for `admin` login |

---

## 🧪 Testing

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

Tests are located in `src/lib/__tests__/` and cover progress calculation and hierarchy logic.
