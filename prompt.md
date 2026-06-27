# ⚡ Bento Link Hub — Full-Stack Internship Blueprint
### Node.js · Express.js · React.js · JSON Storage
#### Enterprise Track · 4-Phase Build Program

---

> **Before you write a single line of code** — read this entire document once. Every section builds on the last. Skipping ahead will cost you more time than it saves.

---

## 🗺️ What You're Building

A **live, data-driven Bento Grid Link Hub** — imagine a supercharged link-in-bio page where:

- Every card is pulled dynamically from your own backend (zero hardcoded content)
- Every click is silently tracked and stored
- An admin-only dashboard visualizes click analytics as live charts
- Write operations are locked behind JWT authentication

The twist: instead of MongoDB, your data lives in a **`db.json` file** managed entirely by Node.js — no cloud database, no SSL headaches, no connection strings. Pure backend engineering.

**Same data shapes. Same API contracts. Different engine under the hood.**

---

## 📐 Data Structures (Do Not Change These)

These are your two core data shapes. Every route, every component, every chart depends on them staying consistent.

### Link Object
```json
{
  "_id": "uuid-generated-string",
  "title": "My GitHub",
  "url": "https://github.com/username",
  "gridSpanX": 2,
  "gridSpanY": 1,
  "clickCount": 0
}
```

### User Object
```json
{
  "_id": "uuid-generated-string",
  "email": "admin@example.com",
  "password": "$2a$10$hashedpasswordstring"
}
```

### Database File Shape (`db.json`)
```json
{
  "links": [],
  "users": []
}
```

---

## 🏗️ Recommended Folder Structure

```
bento-link-hub/
├── server/
│   ├── routes/
│   │   ├── linkRoutes.js
│   │   └── authRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── db.json              ← your database (add to .gitignore)
│   ├── db.js                ← read/write helper
│   ├── .env                 ← never commit
│   ├── .gitignore
│   └── server.js
└── client/
    ├── src/
    │   ├── hooks/
    │   │   └── useFetchLinks.js
    │   ├── components/
    │   │   ├── BentoCard.jsx
    │   │   ├── SkeletonGrid.jsx
    │   │   └── PrivateRoute.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   └── Dashboard.jsx
    │   └── App.jsx
    ├── .env
    └── package.json
```

---

---

# PHASE 1 — Backend Foundation & API Layer

## What You're Doing

Stand up an Express server, wire up a JSON-based data layer, and expose 3 REST API endpoints that your React app will consume. No MongoDB, no Mongoose — just Node.js `fs` module reading and writing a JSON file.

---

## 1.1 — Project Initialization

```bash
mkdir server && cd server
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken uuid
```

Create your `.env` file:

```properties
PORT=5000
JWT_SECRET=pick_something_long_and_random_here
```

Create your `.gitignore`:

```
node_modules/
.env
db.json
```

---

## 1.2 — The JSON Database Engine (`db.js`)

This file is your entire database layer. It reads from and writes to `db.json` synchronously.

```js
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

const readDB = () => {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

module.exports = { readDB, writeDB };
```

Create `db.json` with empty arrays to start:

```json
{
  "links": [],
  "users": []
}
```

---

## 1.3 — Server Entry Point (`server.js`)

```js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/links', require('./routes/linkRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 1.4 — Link Routes (`routes/linkRoutes.js`)

Three endpoints. Wrap every block in `try-catch`. Return proper HTTP codes.

### Link Data Shape (enforce this manually in every POST)

| Field | Type | Rule |
|---|---|---|
| `title` | String | Required, `.trim()` it |
| `url` | String | Required, must start with `http` |
| `gridSpanX` | Number | Default `1`, min `1`, max `4` |
| `gridSpanY` | Number | Default `1`, min `1`, max `4` |
| `clickCount` | Number | Always starts at `0` |
| `_id` | String | Generated with `uuid` on creation |

### The Three Routes

**`GET /api/links`** — Returns all links as a JSON array. HTTP 200.

**`POST /api/links`** — Validates payload, builds a new link object, pushes it into `db.links`, writes to file, returns the new object. HTTP 201.

**`PATCH /api/links/click/:id`** — Finds the link by `_id`, increments `clickCount` by exactly 1, writes to file, returns the updated object. HTTP 200. If not found → 404.

```js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../db');

// GET /api/links
router.get('/', (req, res) => {
  try {
    const db = readDB();
    res.status(200).json(db.links);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/links
router.post('/', (req, res) => {
  try {
    const { title, url, gridSpanX, gridSpanY } = req.body;
    if (!title || !url) {
      return res.status(400).json({ message: 'Title and URL are required' });
    }
    const newLink = {
      _id: uuidv4(),
      title: title.trim(),
      url,
      gridSpanX: Math.min(Math.max(gridSpanX || 1, 1), 4),
      gridSpanY: Math.min(Math.max(gridSpanY || 1, 1), 4),
      clickCount: 0,
    };
    const db = readDB();
    db.links.push(newLink);
    writeDB(db);
    res.status(201).json(newLink);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/links/click/:id
router.patch('/click/:id', (req, res) => {
  try {
    const db = readDB();
    const index = db.links.findIndex(l => l._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Link not found' });
    }
    db.links[index].clickCount += 1;
    writeDB(db);
    res.status(200).json(db.links[index]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
```

---

## 1.5 — Error Handling Rules

- Every route wrapped in `try-catch` — no exceptions
- Missing or wrong `_id` → HTTP `404`
- Missing required fields in body → HTTP `400`
- Server crashes are unacceptable — catch everything

---

## ✔️ Phase 1 Checklist
- [ ] `npm start` runs without errors
- [ ] Terminal shows `Server running on port 5000`
- [ ] `GET http://localhost:5000/api/links` returns `[]`
- [ ] `POST /api/links` creates a record and it appears in `db.json`
- [ ] `PATCH /api/links/click/:id` increments `clickCount` in `db.json`
- [ ] Bad ID returns `404`, missing fields return `400`
- [ ] Postman screenshots saved for all 3 routes

---

---

# PHASE 2 — React Frontend & Dynamic Grid

## What You're Doing

Build the React app. Connect it to your Phase 1 API. Render a dynamic bento grid where card dimensions come from the database — not from CSS classes you typed yourself.

---

## 2.1 — React App Setup

```bash
npm create vite@latest client -- --template react
cd client
npm install axios react-router-dom
```

Create `client/.env`:

```
VITE_API_URL=http://localhost:5000
```

Reference it in code as `import.meta.env.VITE_API_URL`. Never paste `localhost:5000` directly into a component.

---

## 2.2 — Data Fetching Hook (`hooks/useFetchLinks.js`)

```js
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useFetchLinks = (url) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get(url)
      .then(res => { setLinks(res.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [url]);

  return { links, loading, error };
};
```

---

## 2.3 — Three UI States (All Required)

Your grid must handle all three — missing any one of these fails the task.

**While loading** → Show a skeleton grid. Grey placeholder blocks in the same grid layout. No spinners — actual block shapes.

**On error** → Show a styled error card. Something like: *"Could not reach the server. Make sure your backend is running."*

**Data loaded** → Render the real bento grid.

---

## 2.4 — Dynamic Grid Rendering (Critical Rule)

Map over your `links` array. Card sizing comes from `gridSpanX` and `gridSpanY` — inline styles only. No hardcoded layout classes.

```jsx
{links.map(item => (
  <div
    key={item._id}
    onClick={() => handleCardClick(item)}
    style={{
      gridColumn: `span ${item.gridSpanX}`,
      gridRow: `span ${item.gridSpanY}`
    }}
    className="bento-card"
  >
    <h3>{item.title}</h3>
  </div>
))}
```

---

## 2.5 — Click Tracking Handler

Two things happen at once when a card is clicked. The user is not blocked waiting for the API.

```js
const handleCardClick = async (item) => {
  window.open(item.url, '_blank');
  try {
    await axios.patch(
      `${import.meta.env.VITE_API_URL}/api/links/click/${item._id}`
    );
  } catch (err) {
    console.error('Click tracking failed:', err);
  }
};
```

---

## ✔️ Phase 2 Checklist
- [ ] React app runs at `http://localhost:5173`
- [ ] Skeleton grid appears during loading
- [ ] Error card appears when backend is offline
- [ ] Bento grid renders from live API data
- [ ] `gridSpanX` and `gridSpanY` drive card sizing (no hardcoded classes)
- [ ] Clicking a card opens the URL and sends the PATCH request silently
- [ ] React screenshots saved (loading, grid, error states)

---

---

# PHASE 3 — JWT Authentication & Route Protection

## What You're Doing

Add a register/login system. Hash all passwords. Lock write routes behind a JWT middleware so only authenticated users can add or delete links.

---

## 3.1 — Auth Routes (`routes/authRoutes.js`)

### User Data Shape (stored in `db.users`)

| Field | Type | Rule |
|---|---|---|
| `_id` | String | uuid generated |
| `email` | String | Unique — check before inserting |
| `password` | String | bcrypt hashed, 10 rounds minimum |

### POST /api/auth/register

- Check if email already exists in `db.users`
- Hash the password: `bcrypt.hash(password, 10)`
- Push new user object into `db.users`
- Write to file
- Return success message — never return the password

### POST /api/auth/login

- Find user by email in `db.users`
- If not found → 404
- Compare passwords: `bcrypt.compare(plainText, hashedPassword)`
- If mismatch → 401
- If match → sign a JWT and return it

```js
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
res.status(200).json({ token });
```

---

## 3.2 — Auth Middleware (`middleware/authMiddleware.js`)

This function runs before any protected route. If it fails, the route never executes.

```js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};
```

Apply it to `POST /api/links` and any `DELETE` routes by importing and passing it before your route handler.

---

## ✔️ Phase 3 Checklist
- [ ] `POST /api/auth/register` creates a user with hashed password in `db.json`
- [ ] `POST /api/auth/login` returns a JWT on success
- [ ] Plaintext passwords are never visible in `db.json`
- [ ] `POST /api/links` without a token returns `401`
- [ ] `POST /api/links` with a valid token creates the link successfully
- [ ] Postman screenshots showing both authorized and unauthorized responses

---

---

# PHASE 4 — Analytics Dashboard & Private Routes

## What You're Doing

Build a locked admin dashboard in React. Pull live click data from your backend. Render it as a responsive chart. Unauthenticated users get bounced back to login.

---

## 4.1 — Private Route Guard (`components/PrivateRoute.jsx`)

```jsx
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
```

Wire it in `App.jsx`:

```jsx
<Route path="/dashboard" element={
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
} />
```

---

## 4.2 — Dashboard Data Fetching

Fetch with the JWT in the header:

```js
const token = localStorage.getItem('token');
const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/links`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## 4.3 — Data Transformation Helper

Shape the raw links array into what your chart library expects:

```js
const prepareChartData = (links) => {
  return [...links]
    .sort((a, b) => b.clickCount - a.clickCount)
    .map(link => ({
      name: link.title,
      clicks: link.clickCount
    }));
};
```

---

## 4.4 — Chart Integration

Install Recharts:

```bash
npm install recharts
```

Render a responsive bar chart:

```jsx
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from 'recharts';

<ResponsiveContainer width="100%" height={400}>
  <BarChart data={prepareChartData(links)}>
    <XAxis dataKey="name" />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Bar dataKey="clicks" fill="#6366f1" radius={[6, 6, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

`ResponsiveContainer` handles mobile automatically — never hardcode a pixel width on the chart wrapper.

---

## ✔️ Phase 4 Checklist
- [ ] Visiting `/dashboard` without a token redirects to `/login`
- [ ] Dashboard loads and displays live click data
- [ ] Chart renders all link titles with their click counts
- [ ] Chart is responsive on mobile screen widths
- [ ] Dashboard screenshot saved showing live chart

---

---

# 📦 Submission Requirements

## Item A — Technical Documentation (Word Document)

Write a step-by-step engineering log covering all 4 phases. Include:

- Screenshots of `db.json` showing real link and user records
- Postman test screenshots for every endpoint (show the full request body and response)
- React app screenshots: skeleton loading state, live bento grid, error card
- Admin dashboard screenshot with the analytics chart visible and populated

## Item B — LinkedIn Demo Video (strictly 1–2 minutes)

Record yourself doing all of this live on screen:

1. Register a brand new account
2. Add a link and watch it appear in the bento grid
3. Click a card — then show `db.json` or the dashboard with the updated click count
4. Show the analytics chart reflecting real data

Post it to LinkedIn. Write a caption describing what you built. Tag your mentor.

## Item C — GitHub Repository

- Folder structure: `/server` and `/client` as separate subdirectories
- `.gitignore` must cover: `node_modules/`, `.env`, `db.json`, `dist/`, `build/`
- `README.md` must include: how to install, how to configure `.env`, how to run server and client
- Repository must be **public**
- Submit the URL to Google Classroom or DM your mentor directly

---

# 🔧 Engineering Standards

These are non-negotiable habits. Every professional team enforces them.

| Rule | Why It Matters |
|---|---|
| Environment variables for all config | Secrets never end up in GitHub |
| Validate input before writing to `db.json` | Corrupt data breaks every route that reads it |
| `VITE_API_URL` in client `.env` | Frontend works in dev and prod without code changes |
| `try-catch` on every route | One bad request never takes down the server |
| Frequent, descriptive git commits | You can always roll back to a working state |
| Test in Postman before building UI | Catch backend bugs before they disguise themselves as frontend bugs |
| Never log stack traces to API consumers | Exposes your file structure and internal logic |

---

*Read the checklist at the end of each phase before moving to the next one. If a box isn't checked, the phase isn't done. Ship clean, document everything, commit often.*