# Relay — Real-Time Group Chat

> A full-stack real-time chat application with JWT authentication, live Socket.io messaging, and persistent PostgreSQL history.

<!-- ![Relay demo](./docs/demo.gif) -->

**Live demo:** [your-relay-app.vercel.app](https://your-relay-app.vercel.app)

---

## Features

- 🔐 **JWT auth** — signup, login, protected routes, and auto-redirect
- ⚡ **Real-time messaging** via WebSockets (Socket.io), zero polling
- 🗄️ **Persistent history** — last 50 messages fetched on room join
- 👥 **Live online count** — updates instantly on connect and disconnect
- ✍️ **Typing indicators** — see when others are composing a message
- 🔔 **Error toasts** for socket failures
- 📜 **Smart auto-scroll** — follows new messages only when you're at the bottom
- 💬 **Message grouping** — consecutive messages from the same user share one avatar/header
- 📱 **Responsive** — works on mobile and desktop

---

## Tech Stack

| Layer      | Technology          | Notes                                                  |
|------------|---------------------|--------------------------------------------------------|
| Frontend   | React 19 (Vite)     | SPA with fast HMR dev experience                       |
| Styling    | Tailwind CSS v3     | Utility-first; rapid, consistent UI                    |
| Backend    | Node.js + Express 5 | ESM modules throughout                                 |
| Real-time  | Socket.io           | WebSocket abstraction with fallback transport          |
| Auth       | JWT + bcrypt        | Stateless auth; token verified on HTTP and WS layers   |
| Database   | PostgreSQL          | Relational schema with foreign-key message ownership   |
| Deployment | Railway + Vercel    | Railway for server + DB; Vercel for static client      |

---

## Project Structure

```
relay-chat/
├── client/                         ← Vite + React frontend
│   └── src/
│       ├── api/axios.js            ← Axios instance with JWT interceptor
│       ├── components/             ← ProtectedRoute, GuestRoute
│       ├── context/AuthContext.jsx ← JWT + user state (localStorage)
│       ├── pages/                  ← Landing, Login, Signup, Chat
│       ├── socket.js               ← Socket.io singleton (autoConnect: false)
│       └── App.jsx                 ← React Router route definitions
└── server/                         ← Express backend
    ├── db/connection.js            ← PostgreSQL pool (DATABASE_URL aware)
    ├── middleware/verifyToken.js   ← JWT verification middleware
    ├── routes/auth.js              ← POST /api/auth/signup, /login
    ├── routes/messages.js          ← GET /api/messages (last 50, protected)
    ├── socket/socketHandler.js     ← Socket.io: message, typing, online count
    └── index.js                    ← HTTP server + Socket.io bootstrap
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+

### 1. Clone and install

```bash
git clone https://github.com/yourusername/relay-chat.git
cd relay-chat

cd server && npm install
cd ../client && npm install
```

### 2. Create the database

```sql
CREATE DATABASE relay;
\c relay

CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id),
  username   VARCHAR(50),
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Environment variables

Create `.env` in the **project root** (next to `client/` and `server/`):

```env
# Database — local dev
DB_USER=postgres
DB_HOST=localhost
DB_NAME=relay
DB_PASSWORD=yourpassword
DB_PORT=5432

# Auth
JWT_SECRET=change-this-to-a-long-random-string

# Server
PORT=5001
CLIENT_URL=http://localhost:5173
```

Create `client/.env.local`:

```env
VITE_API_URL=http://localhost:5001
```

### 4. Run

```bash
# Terminal 1 — server
cd server && npm run dev

# Terminal 2 — client
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Open a second tab to see messages appear in real time.

---

## Deployment

### Railway — Express server + PostgreSQL

1. Push your code to GitHub.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Add a **PostgreSQL** plugin inside the project.
   Railway automatically sets `DATABASE_URL` — `server/db/connection.js` reads this automatically.
4. Set the **root directory** to `server/`.
5. Railway detects Node.js and runs `npm start` (`node index.js`).
6. Add environment variables in the Railway dashboard:

   | Key          | Value                             |
   |--------------|-----------------------------------|
   | `JWT_SECRET` | a long random string              |
   | `CLIENT_URL` | your Vercel URL (from step below) |

7. In the Railway PostgreSQL console, run the `CREATE TABLE` SQL above.
8. Note your Railway server URL (e.g. `https://relay-server.railway.app`).

### Vercel — React client

1. Import the `client/` folder as a new project on [vercel.com](https://vercel.com).
2. Set the environment variable:

   | Key            | Value                              |
   |----------------|------------------------------------|
   | `VITE_API_URL` | `https://relay-server.railway.app` |

3. Build command: `npm run build` — Output directory: `dist`.
4. Copy the Vercel URL back into Railway's `CLIENT_URL` variable and redeploy.

---

## Architecture

### Authentication

1. User signs up → server hashes password with bcrypt → returns a signed JWT (7-day expiry)
2. React stores the token in `localStorage` under `relay_token`
3. An Axios interceptor attaches `Authorization: Bearer <token>` on every outgoing request
4. Express `verifyToken` middleware validates the token on all protected routes
5. Socket.io verifies the same token during the WebSocket handshake; invalid tokens are rejected before the connection is established

### Real-time messaging

1. On `/chat` mount, `socket.connect()` is called with the JWT in the auth payload
2. The server authenticates the token before accepting the WebSocket connection
3. User sends a message → client emits `new_message`
4. Server inserts the row into PostgreSQL, then broadcasts the full message object to all connected clients
5. Every open browser receives the `message` event and appends it to their list — no refresh, no polling

### Typing indicators

1. Client emits `typing` on each keystroke (when input is non-empty)
2. Server broadcasts `user_typing` to all other clients on the first event of a burst, then starts a 3-second auto-clear timer
3. After 3 s of silence, server broadcasts `user_stop_typing`
4. On disconnect, the server immediately clears any in-progress typing state for that user

### Smart scroll

An `onScroll` handler tracks whether the user is within 150 px of the bottom of the message container. New incoming messages only trigger `scrollIntoView` when that flag is `true`, so reading message history is never interrupted.

---

## Scalability Considerations

| Bottleneck | Mitigation |
|---|---|
| Single Node.js process | Horizontal scaling behind a load balancer |
| Socket.io across multiple instances | Redis adapter (`@socket.io/redis-adapter`) to share socket state |
| PostgreSQL under heavy load | Tune connection pool `max`; add read replicas |
| Static asset delivery | Serve the built React app from a CDN (Vercel handles this by default) |

---

## License

MIT