# 🎮 Premium UNO Online Multiplayer Game

A complete, production-ready, real-time online multiplayer UNO card game built for high concurrency, authentic competitive card play, and a modern responsive gaming experience.

---

## 🌟 Key Features

### 🎴 Authentic Server-Authoritative Game Engine
- **Standard 108-Card Classic Deck:**
  - 19 Red cards (one 0, two each of 1–9)
  - 19 Green cards (one 0, two each of 1–9)
  - 19 Blue cards (one 0, two each of 1–9)
  - 19 Yellow cards (one 0, two each of 1–9)
  - 8 Skip cards (2 per color)
  - 8 Reverse cards (2 per color)
  - 8 Draw Two cards (2 per color)
  - 4 Wild cards
  - 4 Wild Draw Four cards
- **Cryptographic Fisher-Yates Card Shuffling:** Powered by Node.js `crypto.randomInt` with guaranteed zero card duplication or loss.
- **Strict Turn Enforcement & Action Validation:** The client is purely a rendering view; all moves, draws, colors, UNO declarations, and challenges are verified and executed on the backend.
- **Special Action Semantics:**
  - **Skip:** Skips next player. In 2-player games, gives current player an immediate extra turn.
  - **Reverse:** Inverts turn direction. In 2-player games, functions as Skip.
  - **Draw Two:** Next player draws 2 and loses their turn.
  - **Wild:** Color selection dialog; next player plays the selected color.
  - **Wild Draw Four (+4):** Can only be legally played when the player has no card matching the active color.
  - **Wild Draw Four Challenge:** Next player can challenge. If challenged and guilty, the offender draws 4; if innocent, the challenger draws 6 (4 + 2 penalty).
  - **UNO Declaration & Penalty Catch:** One card remaining triggers UNO button. If caught before next player turn starts without declaration, 2 penalty cards are drawn.
  - **Deck Reshuffle:** When draw pile exhausts, the discard pile (minus the top card) is securely reshuffled.
  - **Official Scoring:** Winner receives points matching the values of cards remaining in opponents' hands.

### 🌐 Real-Time Multiplayer & Reconnection Resilience
- **Socket.IO Real-Time Engine:** Low-latency bi-directional messaging with authentication handshake.
- **Private Hand Protection:** Opponents receive only card counts; only the authenticated player receives their private hand cards.
- **Disconnection Handling:** If connection drops, game state is preserved in Redis, a 30-second grace window begins, and returning players seamlessly re-enter their seat.
- **Bot Takeover:** When enabled, an AI bot smoothly assumes control if a player abandons the match.

### 🤖 Intelligent AI Bots
- **Easy:** Random valid moves for casual matches.
- **Medium:** Color retention heuristics and defensive action card plays against low-card opponents.
- **Hard:** Advanced hand composition analysis, opponent card threshold tracking, strategic Wild/Draw-4 conservation, and optimal color selection.

### 🎨 Premium UI/UX & Responsive Design
- **Luxury Gaming Felt Table:** Radial emerald felt gradient with realistic card shadows and glassmorphic panels.
- **Fluid Card Animations:** Smooth Framer Motion transitions for dealing, hovering, selecting, and playing cards.
- **Dynamic Color Indicators & Timers:** SVG directional flow indicator and synchronized countdown timers.
- **Web Audio Sound Effects:** Native Web Audio API sound synthesis for card plays, draws, UNO announcements, and victory/defeat stingers (no external audio assets required).
- **Mobile First & Responsive:** Optimized for desktop, tablet, and mobile portrait/landscape gameplay.

---

## 🏗️ Architecture & Technology Stack

```
multi-uno/
├── apps/
│   ├── server/                 # Express, Socket.IO, Prisma ORM, Redis, Vitest
│   │   ├── prisma/
│   │   │   └── schema.prisma   # PostgreSQL Schema (14 entities)
│   │   ├── src/
│   │   │   ├── config/         # App, Redis, and Database configurations
│   │   │   ├── middleware/     # JWT Auth, Rate limiting, Error handlers
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Registration, Login, Guest accounts, JWT
│   │   │   │   ├── users/      # Profile, Stats, Match history
│   │   │   │   ├── friends/    # Friend requests, online status
│   │   │   │   ├── rooms/      # Lobby room management, private codes
│   │   │   │   ├── matchmaking/# Skill & queue-based matchmaking
│   │   │   │   ├── game/
│   │   │   │   │   ├── engine/ # Deck, Card, Rules, Scoring, State
│   │   │   │   │   ├── actions/# playCard, drawCard, declareUno, challenge
│   │   │   │   │   ├── bots/   # AI Strategies (easy, medium, hard)
│   │   │   │   │   ├── timers/ # Server-side turn timers
│   │   │   │   │   └── reconnect/ # Disconnect recovery
│   │   │   │   ├── chat/       # In-game chat service
│   │   │   │   ├── leaderboard/# Global, weekly, and friends ratings
│   │   │   │   ├── achievements/# 7 unlockable achievements
│   │   │   │   └── admin/      # Metrics, reports, ban management
│   │   │   ├── sockets/        # Socket.IO room, game, chat handlers
│   │   │   └── __tests__/      # Automated Vitest test suites (83 tests)
│   └── client/                 # Next.js 15, React 19, Tailwind CSS, Framer Motion, Zustand
│       └── src/
│           ├── app/            # App router pages (Landing, Auth, Lobby, Room, Game, Profile, Leaderboard)
│           ├── components/     # Cards, Game Table, Controls, Layout
│           ├── hooks/          # useGame, useSocket, useAuth, useSounds
│           ├── store/          # Zustand client state stores
│           └── lib/            # Socket.IO client, API utilities
├── turbo.json                  # Turborepo task pipeline
└── package.json                # Root monorepo workspace
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (or Supabase/Docker instance)
- Redis (optional, falls back gracefully in development)

### 1. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy environment templates:
```bash
cp .env.example apps/server/.env
cp apps/client/.env.local apps/client/.env
```

Ensure `DATABASE_URL` in `apps/server/.env` points to your PostgreSQL instance:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/uno_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secure-jwt-secret-here"
CLIENT_URL="http://localhost:3001"
PORT=5001
NEXT_PUBLIC_SERVER_URL="http://localhost:5001"
NEXT_PUBLIC_WS_URL="http://localhost:5001"
```

### 3. Database Migration & Seeding
Generate Prisma Client, push the schema to PostgreSQL, and seed test accounts:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 👤 Test Accounts
Pre-configured test accounts ready for login:
| Role | Email | Password | Username | Rating | Level |
|---|---|---|---|---|---|
| Player 1 | `player1@uno.com` | `password123` | Alice | 1200 | Lv. 3 |
| Player 2 | `player2@uno.com` | `password123` | Bob | 1150 | Lv. 2 |
| Player 3 | `player3@uno.com` | `password123` | Charlie | 1050 | Lv. 1 |
| Admin | `admin@uno.com` | `admin123` | Admin | 1500 | Lv. 10 |

*(You can also click **"🎭 Continue as Guest"** on the login page to play immediately without entering any credentials).*

### 4. Running the Automated Tests
Run the comprehensive game engine test suite:
```bash
npm test
```
All 83 tests verify deck creation, shuffle conservation, classic rules, house rules, special card actions, challenges, UNO declarations, and bot algorithms.

### 5. Start Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend:** [http://localhost:3001](http://localhost:3001)
- **Backend API:** [http://localhost:5001](http://localhost:5001)
- **Health Check:** [http://localhost:5001/health](http://localhost:5001/health)

### 6. Production Build
```bash
npm run build
npm start
```

---

## 🧪 Automated Test Coverage

The test suite covers all required UNO mechanics:
- ✅ **Deck:** 108 cards, correct color distribution, wild cards, Fisher-Yates randomness.
- ✅ **Rules:** Matching by color and value, wild card eligibility, WD4 legality checks.
- ✅ **Actions:** Playing cards, drawing cards, skipping, reversing, 2-player rules.
- ✅ **Challenges:** WD4 challenge success (previous player +4) vs failed challenge (challenger +6).
- ✅ **UNO Penalties:** Valid declarations vs catching players who failed to declare.
- ✅ **Scoring:** Point calculations from remaining cards.
- ✅ **Bots:** Strategy heuristics across Easy, Medium, and Hard tiers.
- ✅ **Security:** Hand obfuscation in public state payloads.

---

## 🔒 Security Highlights

1. **Zero Client Trust:** Hand cards, legality, turn order, and scores are evaluated server-side.
2. **Private Hand Isolation:** Public socket events emit only card counts for opponents.
3. **Protected Auth & Sockets:** JWT validation is enforced on both REST endpoints and Socket.IO connection handshakes.
4. **Rate Limiting & Anti-Spam:** Express rate limiting on APIs and chat message rate limiting (max 10 msgs / 10s).
5. **Sanitized Input:** Validated with Zod schemas and SQL-injection-proof Prisma ORM queries.

---

## 📄 License
MIT

