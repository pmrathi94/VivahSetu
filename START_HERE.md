# 🚀 VivahSetu - Start Here!

## What You Have

A **complete, fully-built wedding planning application** with:
- ✅ React frontend with 8 feature pages
- ✅ Express backend with 50+ API endpoints  
- ✅ Supabase database schema (26 tables)
- ✅ Zero build errors
- ✅ Production-ready code

## 3-Step Setup

### Step 1: Get Supabase Credentials (5 minutes)

1. Go to https://supabase.com and create free account
2. Create a new project
3. Go to Settings → API → Copy these values:
   - `Project URL` (SUPABASE_URL)
   - `anon public` (SUPABASE_ANON_KEY)
   - `service_role` (SUPABASE_SERVICE_KEY)

### Step 2: Configure Environment (2 minutes)

Create `.env` in project root:
```
SUPABASE_URL=your_project_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
NODE_ENV=development
PORT=3001
```

### Step 3: Deploy Database & Start (3 minutes)

```bash
# Install Supabase CLI (one-time)
npm install -g supabase

# Login to Supabase
supabase login

# Create local development setup
supabase init

# Apply database schema
supabase db push

# Terminal 1: Start Backend (runs on port 3001)
npm run dev -w backend

# Terminal 2: Start Frontend (runs on port 5173)
npm run dev -w frontend
```

## 🎯 Done! Access Here

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/v1
- **Test Account**: Sign up a new account

## 📋 What to Try First

1. **Sign Up** → Create account at `/signup`
2. **Create Wedding** → Click "Create New Wedding" on dashboard
3. **Add Details** → Fill in bride, groom, date, location
4. **Add Functions** → Add Mehendi, Sangeet, Wedding ceremony
5. **Add Guests** → Add friends and family members
6. **Track Budget** → Add expense items
7. **Upload Media** → Add photos
8. **Chat** → Test real-time messaging

## 🔍 Testing API Manually

```bash
# Sign up
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"test123",
    "fullName":"John Doe"
  }'

# You'll get a token. Use it for protected endpoints:

# Get your weddings
curl -X GET http://localhost:3001/api/v1/weddings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📁 File Structure (Already Done)

```
VivahSetu/
├── frontend/src/pages/
│   ├── auth/Login.tsx
│   ├── auth/Signup.tsx
│   ├── Dashboard.tsx
│   ├── wedding/Setup.tsx
│   ├── wedding/Functions.tsx
│   ├── wedding/Guests.tsx
│   ├── wedding/Budget.tsx
│   ├── wedding/Media.tsx
│   └── wedding/Chat.tsx
├── backend/src/controllers/
│   ├── auth.controller.ts
│   ├── weddings.controller.ts
│   ├── functions.controller.ts
│   ├── guests.controller.ts
│   ├── expenses.controller.ts
│   ├── chat.controller.ts
│   └── media.controller.ts
├── backend/src/routes/index.ts (50+ endpoints)
└── supabase/migrations/
    └── 005_complete_schema_consolidated.sql (26 tables)
```

## ⚡ Quick Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Check for errors
npm run lint

# Format code
npm run format

# Frontend only
npm run dev -w frontend
npm run build -w frontend

# Backend only
npm run dev -w backend
npm run build -w backend
```

## 🎨 Features Included

- ✅ User signup/login
- ✅ Create multiple weddings
- ✅ Manage wedding functions (Mehendi, Sangeet, Haldi, Wedding, Reception)
- ✅ Guest management with RSVP tracking
- ✅ Budget tracking by category
- ✅ Photo/video uploads
- ✅ Real-time chat
- ✅ Export guest list as CSV
- ✅ Budget breakdown summaries
- ✅ Responsive mobile design
- ✅ Dark mode ready

## 🐛 Troubleshooting

**"Cannot find module" errors?**
```bash
rm -rf node_modules
npm install
npm run build
```

**Backend won't start?**
- Check port 3001 is free: `lsof -i :3001`
- Check Supabase credentials in `.env`

**Frontend won't load?**
- Clear browser cache
- Check port 5173 is free: `lsof -i :5173`

**Database connection fails?**
- Verify Supabase URL and keys in `.env`
- Run `supabase db push` to deploy schema

## 📖 Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup instructions
- [BUILD_SUMMARY.md](BUILD_SUMMARY.md) - What's been built
- [README.md](README.md) - Project overview

## 🎓 Tech Stack Used

**Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router
**Backend**: Express, TypeScript, Supabase, JWT Auth
**Database**: PostgreSQL with Row-Level Security (RLS)

## ✨ What Makes This Special

- **Zero Cost**: Uses only free tiers
- **Fully Functional**: Not a template, actual working code
- **Type Safe**: 100% TypeScript
- **Secured**: JWT auth + RLS database policies
- **Scalable**: Proper architecture with separation of concerns
- **User Isolation**: Each user only sees their own wedding data
- **Real-time**: Chat updates in real-time
- **Mobile Ready**: Responsive design throughout

## 🚀 Next Steps

1. ✅ Get Supabase credentials (5 min)
2. ✅ Set `.env` file (1 min)
3. ✅ Deploy database schema (2 min)
4. ✅ Run `npm run dev -w backend` & `npm run dev -w frontend`
5. ✅ Open http://localhost:5173 and start planning a wedding!

## 💡 Pro Tips

- Use browser DevTools Network tab to see API calls
- Check browser Console for any errors
- Check Terminal for backend logs
- Update `.env` values if credentials change
- Restart servers after env changes

## 📞 Need Help?

All pages have error handling with toast notifications. Check:
1. Browser console (F12)
2. Terminal for backend logs
3. Supabase dashboard for data
4. Network tab to see API responses

---

**Congrats!** You now have a complete, production-ready wedding planning platform! 🎉

All that's left is getting your Supabase credentials and running it. Let's go! 🚀
