# 🎊 VivahSetu - Indian Wedding Planning Platform

> **Emotion-First Wedding Planning for Every Detail**
>
> React 19 • TypeScript 5.4 • Express.js • Supabase • Zod Validation
>
> Real-time location search • Role-based access • Multi-wedding isolation • Zero payments

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.0.0-61DAFB.svg)
![Node](https://img.shields.io/badge/Node-20+-brightgreen.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ What is VivahSetu?

VivahSetu is a **free, web-based platform** for planning perfect Indian weddings. Designed for modern couples who want to organize weddings with their families—handling budgets, vendors, guest lists, celebrations, and memories—all in one place.

**Zero payments • Zero ads • Zero tracking • Zero HTML5 validation (Zod only)**

### 🎯 Core Features

**🔍 Smart Location Search**
- Search by State → City → Area
- Venue & vendor discovery
- Real-time results from database
- Free integration

**👥 Role-Based Access**
- Main Admin (couple planning)
- Wedding Admin (coordinator)
- Family Members (bride/groom sides)
- Friends & Guests (view-only)
- 12 granular role types with permission system

**💰 Budget Management**
- Separate bride/groom budgets
- Vendor cost tracking
- Expense categories
- Real-time totals
- Shared expense splitting

**📸 Media Studio**
- Photo versioning
- Role-based access control
- Watermarking & screenshot prevention
- Gallery organization

**🎭 26+ Wedding Modules**
- Setup, Functions, Guests, Budget, Media, Chat
- Vendors, Timeline, Analytics, Kundali
- Packing Lists, Sangeet, Costumes
- Honeymoon Plans, RSVP Tracking
- And 11+ more!

---

## 🏗 Architecture

### Frontend (React 19 + TypeScript)
```
frontend/
├── src/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx          # Email/password login with Zod validation
│   │   │   ├── Signup.tsx         # Registration with schema validation
│   │   │   └── ResetPassword.tsx  # Password recovery with Zod schemas
│   │   ├── wedding/
│   │   │   ├── Setup.tsx          # Wedding configuration
│   │   │   ├── Functions.tsx      # Ceremonies & rituals
│   │   │   ├── Guests.tsx         # Guest management & RSVP
│   │   │   ├── Budget.tsx         # Expense tracking
│   │   │   ├── Media.tsx          # Photo/video management
│   │   │   ├── Chat.tsx           # Group messaging
│   │   │   ├── Timeline.tsx       # Wedding timeline
│   │   │   ├── Vendors.tsx        # Vendor directory
│   │   │   ├── Analytics.tsx      # Wedding insights
│   │   │   └── More...
│   ├── lib/
│   │   ├── api-client.ts          # Axios instance with auth
│   │   ├── validation.ts          # Zod schemas (NOT HTML5)
│   │   └── location-search.ts     # Location service
│   └── styles/
│       └── index.css              # Tailwind CSS
```

### Backend (Express + TypeScript)
```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── weddings.controller.ts
│   │   ├── functions.controller.ts
│   │   ├── vendors.controller.ts
│   │   ├── budget.controller.ts
│   │   ├── chat.controller.ts
│   │   └── 7+ more...
│   ├── middleware/
│   │   ├── auth.ts               # JWT verification (Supabase)
│   │   └── rbac.ts               # Role-based access
│   ├── routes/
│   │   └── index.ts              # 50+ API endpoints
│   └── services/
│       ├── location-search.ts
│       └── More...
```

### Database (Supabase PostgreSQL)
```
supabase/migrations/
├── 005_complete_schema_consolidated.sql (Legacy - kept for reference)
├── 006_complete_vivahsetu_schema.sql    (Legacy - kept for reference)
└── 007_vivahsetu_final_schema.sql       (ACTIVE - Consolidated schema)
```

**26 tables with RLS security:**
- roles, users, weddings, functions, vendors, budget
- chat_groups, chat_messages, media_studio, kundali
- packing_list, notifications, ai_toggle, sangeet
- costumes, makeup_trials, jewelry, menus, food_items
- rsvp, honeymoon_plans, tasks, audit_logs, galleries
- locations, export_logs, app_settings, search_history

---

## 📦 Dependencies

### Frontend (React 19 SPA)

**Form & Validation (NOT HTML5)**
- **zod** ^3.22.0 - Schema validation with TypeScript
- **react-hook-form** ^7.48.0 - Form state management
- **@hookform/resolvers** ^3.3.0 - Zod resolver integration

**Core Dependencies**
- **react** ^19.0.0 - UI library
- **react-dom** ^19.0.0 - DOM rendering
- **react-router-dom** ^7.0.0 - Routing
- **@supabase/supabase-js** ^2.45.0 - Database & JWT auth from Supabase
- **axios** ^1.6.0 - HTTP client
- **zustand** ^5.0.0 - State management

**UI & Animation**
- **tailwindcss** ^3.4.0 - Utility CSS
- **framer-motion** ^10.16.0 - Animations
- **lucide-react** ^0.408.0 - Icons
- **react-hot-toast** ^2.4.0 - Notifications

**Utilities**
- **date-fns** ^3.0.0 - Date manipulation
- **clsx** ^2.1.0 - Classname utility

### Backend (Express + Node)

**Form & Validation (NOT JWT generation)**
- **zod** ^3.22.0 - Schema validation
- **joi** ^17.11.0 - Alternative validation

**Core Dependencies**
- **express** ^4.18.0 - Web framework
- **@supabase/supabase-js** ^2.45.0 - Database client & JWT verification from Supabase
- **dotenv** ^16.3.0 - Environment variables
- **helmet** ^7.1.0 - HTTP security
- **compression** ^1.7.0 - Response compression
- **express-rate-limit** ^7.1.0 - Rate limiting

**Services**
- **node-geocoder** ^4.2.0 - Location services
- **bcryptjs** ^2.4.3 - Password hashing
- **uuid** ^9.0.0 - UUID generation

**Utilities**
- **winston** ^3.11.0 - Logging
- **jsonwebtoken** ^9.0.0 - Utility only (JWT comes from Supabase)

### Dev Dependencies
- **typescript** ^5.4.0 - Type checking
- **@types/*** - Type definitions
- **eslint** ^8.56.0 - Linting
- **prettier** ^3.0.0 - Code formatting
- **vitest** ^1.0.0 - Testing framework

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 9+
- Git
- Supabase account (free)

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd VivahSetu

# 2. Install all dependencies
npm run install-all

# 3. Create .env file
cp .env.example .env

# 4. Add Supabase credentials
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
NODE_ENV=development
```

### Database Setup

```bash
# Option 1: Deploy via Supabase CLI
supabase db push

# Option 2: Manual import in Supabase Dashboard
# Copy content from supabase/migrations/007_vivahsetu_final_schema.sql
# Paste in Supabase SQL Editor and execute
```

### Development

```bash
# Start both backend & frontend
npm run dev

# Backend runs on: http://localhost:3001
# Frontend runs on: http://localhost:5173

# Or run separately:
npm run dev -w backend
npm run dev -w frontend
```

### Production Build

```bash
# Build both
npm run build

# Start backend
npm run start -w backend

# Build frontend
npm run build -w frontend
```

---

## 📝 Form Validation Strategy

**Important:** VivahSetu uses **Zod schema validation**, NOT HTML5 default validation.

### Validation Examples

**Frontend (React Hook Form + Zod)**
```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short')
});

export function LoginPage() {
  const { register, formState: { errors }, handleSubmit } = useForm({
    resolver: zodResolver(loginSchema)
  });

  return <form onSubmit={handleSubmit(onSubmit)}>
    <input {...register('email')} />
    {errors.email && <span>{errors.email.message}</span>}
  </form>;
}
```

**Backend (Express + Zod)**
```typescript
import { z } from 'zod';

const createWeddingSchema = z.object({
  brideeName: z.string().min(2),
  groomName: z.string().min(2),
  weddingDate: z.string().datetime()
});

app.post('/weddings', (req, res) => {
  const result = createWeddingSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error });
  }
  // Proceed with validated data
});
```

---

## 🔐 Authentication & JWT

**JWT tokens come exclusively from Supabase, not from Node Express.**

- Frontend: Supabase client creates & stores tokens
- Backend: Verifies tokens using Supabase admin SDK
- Expires: Supabase default (24h access token)
- Refresh: Automatic via Supabase session management

---

## 🛠 Configuration

**🌍 26 Core Modules**
- Weddings (multiple, isolated)
- Budgets & expenses
- Vendors (discovery & booking)
- Guest lists & RSVPs
- Food & catering menus
- Functions & rituals
- Sangeet & performances
- Honeymoon planning
- Costume, makeup, jewelry
- Packing lists
- Media & design studio
- Chat & messaging
- Live wedding timeline
- Notifications
- Theme customization
- Multi-language support

**⚡ Real-Time Collaboration**
- Instant updates across devices
- Offline support with sync
- Supabase realtime subscriptions
- No custom auth needed

**🔐 Wedding Isolation**
- Complete data separation
- Row-level security (RLS)
- No cross-wedding leaks
- Privacy by design

---

## 🚀 5-Minute Setup

```bash
# 1. Clone
git clone https://github.com/yourusername/vivahsetu.git
cd vivahsetu

# 2. Install dependencies
npm run install-all

# 3. Create .env from template
cp .env.example .env
# Edit with your Supabase & Google API keys

# 4. Run both servers
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:3001

# 5. Create account & first wedding!
```

See [SETUP.md](SETUP.md) for detailed instructions.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [SETUP.md](SETUP.md) | Full setup guide |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Design & decisions |
| [API.md](API.md) | Backend API reference |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment |

---

## 🏗️ Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | React | 19.0.0 |
| Language | TypeScript | 5.4 |
| Styling | Tailwind CSS | 3.4 |
| Animations | Framer Motion | 10.16 |
| Backend | Express.js | 4.18+ |
| Runtime | Node.js | 20+ |
| Database | PostgreSQL (Supabase) | 15+ |
| Authentication | Supabase JWT | — |
| Real-time | Supabase Subscriptions | — |
| State Management | Zustand | 5.0 |
| Location Search | Node Geocoder | 4.2 |
| PWA | Workbox Service Workers |
| Offline | IndexedDB |

---

## 🔐 Security First

✅ **Zero API key exposure** - Backend proxy for location search  
✅ **Supabase JWT authentication** - Secure, industry-standard  
✅ **Row-level security (100+ policies)** - Wedding isolation by design  
✅ **Input validation** - Joi schemas on all endpoints  
✅ **CORS protection** - Frontend-only access  
✅ **SSL/TLS encryption** - In transit and at rest  

---

## 🌐 Multi-Language Support

Strings in:
- **English** (default)
- **Hindi** (हिंदी)
- **Marathi** (मराठी)
- **Marwadi** (मारवाड़ी)

---

## 📱 Works Everywhere

- **Desktop** - Full experience
- **Tablet** - Optimized layout
- **Mobile** - Touch-first design
- **Offline** - IndexedDB sync
- **Low-bandwidth** - Progressive download

---

## 🛠️ Development

```bash
npm run install-all    # Install all dependencies
npm run dev            # Start dev servers (frontend + backend)
npm run build          # Production build
npm run lint           # Code quality check
npm run format         # Auto-format code
npm run type-check     # TypeScript validation
```

---

## 📊 Project Stats

- **26 Core Modules** for complete wedding planning
- **100+ RLS Policies** for wedding isolation
- **13 Backend Controllers** for API routes
- **5 Core Documentation Files**
- **Zero Third-Party Payments**
- **React 19 + TypeScript 5.4** - Latest versions
- **Node.js 20+ + Express.js** - Production ready

---

## 🌟 Philosophy

VivahSetu believes:
- **Weddings are personal** - Multi-wedding isolation by design
- **Emotions matter** - Not just logistics
- **Freedom > Features** - Use what you need
- **No payments, ever** - Free for everyone
- **Privacy is a right** - No tracking, no ads
- **Indian culture** - Built for Indian weddings
- **Real-time collaboration** - Families stay connected

---

## 🐛 Support & Contribution

- Found a bug? Open an issue
- Have an idea? Create a discussion
- Want to contribute? See CONTRIBUTING.md

---

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Made with ❤️ for Indian Weddings

For more details, see [ARCHITECTURE.md](ARCHITECTURE.md)
- **Data Analysis** - Insights and warnings

---

## 🎯 Next Steps

1. **Setup Locally** → [QUICKSTART.md](QUICKSTART.md)
2. **Understand Architecture** → [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Check API Docs** → [API.md](API.md)
4. **Deploy to Production** → [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📄 License

MIT © 2024-2026 VivahSetu

---

**Made with ❤️ for Indian Weddings**

🌟 Star us on GitHub!  
💬 [Report Issues](https://github.com/vivahsetu/issues)  
📧 [Contact](mailto:support@vivahsetu.com)
