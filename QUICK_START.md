# VivahSetu - Quick Start (5 Minutes)

## ⚡ Get Running in 5 Steps

### Step 1: Environment Setup (2 min)

```bash
# Copy env template
cp .env.example .env

# Edit .env with your Supabase project details
# Get these from https://supabase.com/dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Step 2: Database Setup (1 min)

```bash
# Option A: Using Supabase CLI (recommended)
supabase db push --file supabase/migrations/000_all_full.sql --project-ref YOUR_PROJECT_REF

# Option B: Using psql
psql "$DATABASE_URL" -f supabase/migrations/000_all_full.sql
```

**Verify:**
```bash
# Check tables exist
psql "$DATABASE_URL" -c "\dt public.*"

# Check roles seeded
psql "$DATABASE_URL" -c "SELECT key FROM public.roles LIMIT 5;"
```

### Step 3: Install Dependencies (1 min)

```bash
npm install
```

### Step 4: Start Development Server (immediate)

```bash
npm run dev
```

**This starts:**
- Frontend: http://localhost:3000 (React)
- Backend: http://localhost:3001 (Express)

### Step 5: Test the App (instant)

1. Open http://localhost:3000 in browser
2. Click **Sign Up**
3. Create account with email/password
4. Click **Create Wedding**
5. Fill wedding details and submit
6. Navigate to different tabs (Timeline, Functions, Guests, etc.)

---

## 🔍 Verify Everything Works

### Frontend Tests
- [ ] **Login Page:** Can sign up and log in
- [ ] **Dashboard:** Shows wedding list
- [ ] **Wedding Setup:** Can create new wedding
- [ ] **All Pages:** Timeline, Functions, Vendors, Guests, Budget, Media, Chat all load without errors
- [ ] **Forms:** Can fill and submit forms
- [ ] **API Calls:** Network tab shows successful requests to `/api/v1/...`

### Backend Tests
- [ ] **Health Check:** `curl http://localhost:3001/api/v1/health` returns `{"status":"ok"}`
- [ ] **Auth:** Signup and login endpoints work
- [ ] **Protected Routes:** Accessing without token returns 401
- [ ] **Logs:** Check terminal for request logs

### Database Tests
```bash
# Verify data is being stored
psql "$DATABASE_URL" -c "SELECT COUNT(*) as users FROM public.users;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) as weddings FROM public.weddings;"

# Check audit logs
psql "$DATABASE_URL" -c "SELECT * FROM public.audit_logs ORDER BY changed_at DESC LIMIT 5;"
```

---

## 🛠️ Common Commands

```bash
# Type checking (catch errors early)
npm run type-check

# Linting (code quality)
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Clean build artifacts
rm -rf frontend/dist backend/dist
```

---

## 📦 What's in the Box

| Component | Port | Tech Stack |
|-----------|------|-----------|
| **Frontend** | 3000 | React 19 + Vite + Tailwind |
| **Backend** | 3001 | Node.js + Express + TypeScript |
| **Database** | 5432 | PostgreSQL (Supabase) |
| **Auth** | - | Supabase Auth |
| **Storage** | - | Supabase Storage (S3-compatible) |
| **Realtime** | - | Supabase Realtime WebSocket |

---

## 🚨 Troubleshooting

### "Cannot connect to Supabase"
**Solution:** Check .env has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### "Tables don't exist"
**Solution:** Run migration:
```bash
supabase db push --file supabase/migrations/000_all_full.sql --project-ref YOUR_PROJECT_REF
```

### "Port already in use"
**Solution:** Kill process using port:
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### "CORS error"
**Solution:** Check backend `CORS_ORIGIN` in .env matches frontend URL (http://localhost:3000)

### "TypeScript errors"
**Solution:** Run type check:
```bash
npm run type-check
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [DATABASE_SETUP.md](DATABASE_SETUP.md) | Detailed database migration guide |
| [PROJECT_ALIGNMENT.md](PROJECT_ALIGNMENT.md) | Complete implementation checklist |
| [FINAL_IMPLEMENTATION_STATUS.md](FINAL_IMPLEMENTATION_STATUS.md) | Full status report |
| [MIGRATIONS_COMBINED.md](supabase/MIGRATIONS_COMBINED.md) | SQL migration reference |
| [.env.example](.env.example) | All environment variables |

---

## 🎯 Next Steps

1. **Local Testing:** Follow Step 5 above
2. **Backend Testing:** Test all 100+ API endpoints
3. **Frontend Testing:** Test all 15 pages across mobile/tablet/desktop
4. **Security:** Enable Row Level Security verification
5. **Performance:** Load test with concurrent users
6. **Deployment:** Push to production using CI/CD

---

## 💡 Pro Tips

### For GitHub Codespaces
Backend automatically supports GitHub Codespaces preview URLs! No extra config needed.

### For Development Speed
```bash
# Watch both frontend and backend in separate terminals
npm run dev -w frontend  # Terminal 1
npm run dev -w backend   # Terminal 2
```

### Database Backups
```bash
# Backup before changes
supabase db pull --file backup-$(date +%Y%m%d).sql --project-ref YOUR_PROJECT_REF

# Version control
git add backup-*.sql
git commit -m "backup: database snapshot"
```

---

**Status:** ✅ Ready to use
**Tested:** January 11, 2026
**Support:** Check docs or open an issue
