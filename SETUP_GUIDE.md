# VivahSetu 2026 - Complete Indian Wedding Planning Platform

A comprehensive, real-time, offline-first wedding planning application built with React, Express, and Supabase.

## ✨ Features

- **15 Wedding Planning Modules**: Setup, Functions, Guests, Budget, Media, Chat, and more
- **Role-Based Access**: Bride, Groom, Parents, Vendors, Guests with customized views
- **Real-time Collaboration**: Instant updates across all family members
- **Offline-First Architecture**: Continue planning without internet connection
- **Zero Cost**: Uses only free tiers of Supabase
- **Secure**: Row-Level Security (RLS) ensures each user only sees their own wedding data
- **Progressive Web App**: Install as native app on mobile/desktop

## 🏗 Architecture

```
VivahSetu/
├── frontend/          # React 19 SPA
│   ├── src/
│   │   ├── pages/     # All feature pages (Auth, Dashboard, Wedding modules)
│   │   ├── components/# Reusable UI components
│   │   ├── lib/       # API client, utilities
│   │   ├── config/    # Environment configuration
│   │   └── styles/    # Tailwind CSS
│   └── dist/          # Production build
│
├── backend/           # Express API
│   ├── src/
│   │   ├── controllers/ # All 7 main controllers (auth, weddings, functions, guests, expenses, chat, media)
│   │   ├── middleware/  # Authentication & error handling
│   │   ├── routes/      # 50+ API endpoints
│   │   ├── config/      # Supabase connection, logger
│   │   └── dtos/        # Data validation schemas
│   └── dist/           # Production build
│
└── supabase/
    └── migrations/    # Database schema (26 tables with RLS)
```

## 📦 Key Dependencies

### Frontend (React 19)
- **react-hook-form** ^7.48.0 - Form state management
- **zod** ^3.22.0 - Schema validation with TypeScript
- **@hookform/resolvers** ^3.3.0 - Resolver for Zod with react-hook-form
- **@supabase/supabase-js** ^2.45.0 - Supabase client (JWT auth from Supabase)
- **axios** ^1.6.0 - HTTP client
- **framer-motion** ^10.16.0 - Animation library
- **react-hot-toast** ^2.4.0 - Toast notifications
- **lucide-react** ^0.408.0 - Icon library

### Backend (Express)
- **@supabase/supabase-js** ^2.45.0 - Supabase client (JWT verification from Supabase)
- **express** ^4.18.0 - Web framework
- **zod** ^3.22.0 - Schema validation with TypeScript
- **helmet** ^7.1.0 - HTTP security headers
- **express-rate-limit** ^7.1.0 - Rate limiting
- **winston** ^3.11.0 - Logging
- **bcryptjs** ^2.4.3 - Password hashing
- **node-geocoder** ^4.2.0 - Location services

> **Note**: JWT authentication uses Supabase's built-in JWT tokens, not Node.js/Express jsonwebtoken generation. Supabase handles token creation and validation.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free)
- npm or yarn

### Installation

1. **Clone & Setup**
```bash
cd VivahSetu
npm install
```

2. **Configure Supabase**
   - Create a Supabase project at https://supabase.com
   - Get your `Project URL` and `Anon Key`
   - Create `.env` in root:

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

3. **Deploy Database Schema**
```bash
# Using Supabase CLI
supabase db push

# Or manually import the migration file in Supabase SQL editor:
# supabase/migrations/005_complete_schema_consolidated.sql
```

4. **Start Development Servers**
```bash
# Terminal 1: Backend (Port 3001)
npm run dev -w backend

# Terminal 2: Frontend (Port 5173)
npm run dev -w frontend
```

5. **Build for Production**
```bash
npm run build
```

## 📋 Frontend Pages

### Authentication
- `/login` - Email/password login
- `/signup` - User registration

### Core Dashboards
- `/dashboard` - Main dashboard with wedding overview
- `/wedding/setup` - Create/edit wedding details
- `/wedding/create` - Create new wedding

### Wedding Modules
- `/wedding/functions` - Manage functions (Mehendi, Sangeet, Haldi, Wedding, Reception)
- `/wedding/guests` - Guest list management with RSVP tracking
- `/wedding/budget` - Track expenses by category with summaries
- `/wedding/media` - Photo/video gallery and uploads
- `/wedding/chat` - Real-time messaging for family coordination

## 🔌 API Endpoints

### Authentication (Public)
```
POST   /api/v1/auth/signup              # Register user
POST   /api/v1/auth/login               # Login user
POST   /api/v1/auth/logout              # Logout (Protected)
```

### Weddings (Protected)
```
GET    /api/v1/weddings                 # List user's weddings
POST   /api/v1/weddings                 # Create wedding
GET    /api/v1/weddings/:id             # Get specific wedding
PUT    /api/v1/weddings/:id             # Update wedding
DELETE /api/v1/weddings/:id             # Delete wedding
```

### Functions (Protected)
```
GET    /api/v1/functions?weddingId=X    # List functions
POST   /api/v1/functions                # Create function
PUT    /api/v1/functions/:id            # Update function
DELETE /api/v1/functions/:id            # Delete function
```

### Guests (Protected)
```
GET    /api/v1/guests?weddingId=X       # List guests
POST   /api/v1/guests                   # Add guest
PUT    /api/v1/guests/:id               # Update guest
DELETE /api/v1/guests/:id               # Remove guest
```

### Expenses (Protected)
```
GET    /api/v1/expenses?weddingId=X     # List expenses
POST   /api/v1/expenses                 # Add expense
PUT    /api/v1/expenses/:id             # Update expense
DELETE /api/v1/expenses/:id             # Delete expense
GET    /api/v1/expenses/summary         # Budget summary by category
```

### Chat (Protected)
```
GET    /api/v1/chat?weddingId=X         # Get messages
POST   /api/v1/chat                     # Send message
DELETE /api/v1/chat/:id                 # Delete message
```

### Media (Protected)
```
GET    /api/v1/media?weddingId=X        # List media
POST   /api/v1/media/upload             # Upload file
DELETE /api/v1/media/:id                # Delete media
```

## 🗄 Database Schema

26 tables covering:
- `users` - User profiles with roles
- `weddings` - Wedding event data
- `functions` - Wedding functions (Mehendi, Sangeet, etc.)
- `guests` - Guest list with RSVP status
- `expenses` - Budget tracking by category
- `chat_messages` - Real-time communication
- `media_studio` - Photo/video uploads
- `notifications` - Real-time alerts
- `tasks` - To-do management
- Plus 16 more specialized tables for vendors, kundali, packing, etc.

## 🔐 Security Features

- **Row-Level Security (RLS)**: Each user only sees their own wedding data
- **JWT Authentication**: Secure token-based auth via Supabase
- **Email Verification**: OTP-based signup
- **No Hardcoded Secrets**: All configs via environment variables
- **Rate Limiting**: 100 requests per minute per IP
- **CORS Protection**: Only allow specified origins
- **Helmet.js**: Security headers for all responses

## 📱 Frontend Technology Stack

- **React 19.0.0** - Modern UI library
- **React Router v6** - Client-side routing
- **TypeScript 5.4** - Type-safe code
- **Tailwind CSS 3.4** - Utility-first styling
- **Zustand 5.0** - State management
- **Axios 1.6** - HTTP client
- **Lucide Icons** - Beautiful SVG icons
- **React Hot Toast** - Toast notifications
- **Vite 5.4** - Lightning-fast build tool

## 🚀 Backend Technology Stack

- **Express 4.18** - Web framework
- **TypeScript 5.4** - Type-safe backend
- **Supabase** - PostgreSQL database
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Compression** - Response compression
- **Winston** - Logging
- **Joi** - Input validation
- **JWT** - Authentication tokens

## 📊 Deployment

### Frontend (Vercel/Netlify)
```bash
# Build
npm run build -w frontend

# Deploy dist/ folder
```

### Backend (Railway/Render/Heroku)
```bash
# Build
npm run build -w backend

# Deploy dist/ folder with start script
```

### Environment Variables
Set these on your hosting platform:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `NODE_ENV=production`
- `PORT=3001`

## 🧪 Testing

### Manual Testing
1. Sign up at `/signup`
2. Create wedding at `/dashboard` → "Create New Wedding"
3. Add functions, guests, expenses
4. Test real-time chat
5. Verify data isolation per user

### API Testing
```bash
# Test signup
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","fullName":"Test User"}'

# Test get weddings (requires token)
curl -X GET http://localhost:3001/api/v1/weddings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Environment Setup

### Frontend (.env.local)
```env
VITE_APP_NAME=VivahSetu
VITE_API_URL=http://localhost:3001/api/v1
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_KEY=your-supabase-anon-key
```

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
API_VERSION=v1
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-service-key
CORS_ORIGIN=http://localhost:5173
ENABLE_RATE_LIMITING=false
```

## 🐛 Troubleshooting

**Frontend won't connect to backend?**
- Check `VITE_API_URL` in `.env.local`
- Ensure backend is running on port 3001
- Check CORS configuration in backend

**Supabase connection fails?**
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check network connectivity
- Ensure database schema is migrated

**Build errors?**
- Delete `node_modules` and `.npm-cache`
- Run `npm install` again
- Check TypeScript errors with `npm run build`

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Express Docs](https://expressjs.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📄 License

MIT License - Feel free to use for personal or commercial projects

---

**Built with ❤️ for Indian Weddings** | VivahSetu 2026
