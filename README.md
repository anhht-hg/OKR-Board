# OKR Board — HG Entertainment 2026

Internal OKR management dashboard for the Technology & Operations team.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · SQLite (Prisma 7) · Recharts

---

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full read/write — create, edit, change status |
| **Viewer** | Read-only — all write UI hidden, API mutations blocked |

Default admin credentials are set via environment variable (see below).

---

## Local development

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
# Restore all 189 OKR items from the committed SQL dump
chmod +x prisma/seed/restore-db.sh
./prisma/seed/restore-db.sh
```

### 4. Start dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Production deployment (VPS + PM2)

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
# After cloning — run once to create dev.db from the committed SQL dump
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

## Production deployment (Docker)

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

## Database backup

The entire database is a single file: `dev.db`. Back it up regularly:

```bash
# Add to crontab: crontab -e
0 2 * * * cp /var/www/okr-board/dev.db /backup/okr-$(date +\%Y\%m\%d).db
```

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path, e.g. `file:./dev.db` |
| `ADMIN_PASSWORD` | Yes | Password for `admin` login |
