# 🚀 VIVAH SETU - BACKEND QUICK START

## ✅ SUPABASE-ONLY SETUP COMPLETE

Your backend is now configured to use **Supabase Auth exclusively**. No static JWT secret needed!

---

## 🎯 Quick Facts

| Item | Value |
|------|-------|
| **Backend Port** | 4000 |
| **API Base URL** | http://localhost:4000/api/v1 |
| **Auth Method** | Supabase Auth (JWT managed) |
| **Environment** | development |
| **Config File** | .env.local |
| **JWT Secret** | Optional (Supabase-managed) |

---

## 🚀 START BACKEND (3 Ways)

### Method 1: npm start (Recommended)
```bash
cd backend
npm start
```

### Method 2: Batch File (Windows)
```bash
H:\VivahSetuApp\VivahSetu\backend\run-backend.bat
```

### Method 3: Direct Node
```bash
cd backend
node dist/index.js
```

---

## ✅ SUCCESS INDICATORS

When backend starts correctly, you'll see:
```
🚀 Vivah Setu Backend Server Started
Environment: development
Port: 4000
API Version: /api/v1
```

---

## 🔑 ENVIRONMENT VARIABLES

### Required (All Supabase):
```
SUPABASE_URL=https://agornzaraofbqqusaltr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Server:
```
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

### Optional:
```
JWT_SECRET=supabase-managed  # Not needed, Supabase provides
```

---

## 📁 KEY FILES

| File | Purpose |
|------|---------|
| `backend/src/config/index.ts` | Configuration loading |
| `backend/.env.local` | Backend environment |
| `.env.local` (root) | Root environment |
| `backend/run-backend.bat` | Batch file to run backend |
| `SUPABASE_SETUP_GUIDE.md` | Detailed setup guide |

---

## 🔐 How Authentication Works

```
User → Signup/Login → Supabase Auth → JWT Generated
                                    ↓
                              Frontend stores token
                                    ↓
                    Frontend sends in Authorization header
                                    ↓
                         Backend receives request
                                    ↓
                    Backend verifies via Supabase's public key
                                    ↓
                           Request authenticated ✅
```

**Key Point**: Backend doesn't need JWT_SECRET. Supabase signs tokens, and backend verifies using Supabase's public key.

---

## 🧪 Test Backend is Running

```bash
# Health check
curl http://localhost:4000/api/v1/health

# Expected response:
# {"status":"ok","database":"connected","timestamp":"2026-01-16T..."}
```

---

## 📚 Documentation

- **SUPABASE_SETUP_GUIDE.md** - Complete setup explanation
- **IMPLEMENTATION_GUIDE.md** - API endpoint reference
- **VIVAH_SETU_COMPLETE.md** - Full project guide
- **FINAL_STATUS.md** - Project status

---

## ⚡ Common Issues & Solutions

### Issue: "Missing Supabase variables"
**Solution**: Make sure `.env.local` is in backend directory with valid Supabase credentials

### Issue: "Port 4000 already in use"
**Solution**: Either:
- Kill the process using port 4000
- Change PORT in .env.local to another value (e.g., 4001)

### Issue: "Cannot find module"
**Solution**: 
- Make sure you're in backend directory: `cd backend`
- Run npm start: `npm start`
- Or use batch file: `run-backend.bat`

### Issue: "CORS error when calling from frontend"
**Solution**: Ensure CORS_ORIGIN in .env.local includes frontend URL (default: http://localhost:5173)

---

## 🎊 You're All Set!

Your backend is:
- ✅ **Configured** for Supabase Auth
- ✅ **Built** and ready to run
- ✅ **Documented** with setup guides
- ✅ **Tested** and verified working

### Next Steps:
1. **Start Backend**: `npm start` (from backend directory)
2. **Start Frontend**: `npm run dev` (from frontend directory, in another terminal)
3. **Access App**: http://localhost:5173
4. **Test Features**: Create account, explore features, build your wedding app!

---

## 🎯 Summary

```
✅ Supabase Auth: Configured
✅ JWT Management: Supabase-handled (no static secret)
✅ Environment Variables: Loaded from .env.local
✅ Backend Server: Ready to start on port 4000
✅ Database: Connected to Supabase
✅ Configuration: Complete and verified

Status: 🚀 READY FOR DEVELOPMENT
```

---

**Your VIVAH SETU backend is ready to run! Start it with `npm start` and enjoy building your wedding planning app! 🎊**

*January 16, 2026*
