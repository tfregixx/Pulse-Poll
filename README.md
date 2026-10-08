# PulsePoll: Live Polling Tool

A deploy-ready internship assignment using React, Go/Gin, MongoDB and Redis. MongoDB is the durable source of truth for users, polls and votes. Redis stores live counters and publishes result events. Go broadcasts those events over WebSockets to React clients.

## Features
- Signup/login with bcrypt passwords and JWT
- Authenticated poll creation and management
- Public voting link and QR code
- Backend validation and ownership checks
- MongoDB unique vote index
- Redis atomic counters and Pub/Sub
- WebSocket live updates with reconnect UI
- Poll close control
- Docker development setup

## Run in VS Code
1. Install Docker Desktop and VS Code.
2. Open this project folder in VS Code.
3. Copy `.env.example` to `.env` and replace `JWT_SECRET` with a long random value.
4. Run: `docker compose up --build`
5. Open `http://localhost:5173`.
6. Open the same poll in another browser window and vote. Results and viewer counts update without refresh.

Without Docker, start MongoDB and Redis locally, copy each `.env.example` to `.env`, then run:

```bash
cd backend
go mod tidy
go run ./cmd/server
```

```bash
cd frontend
npm install
npm run dev
```

## Deployment
### Docker Compose
The Compose stack includes health checks, persistent MongoDB and Redis storage, and restart policies. Before deploying, set `JWT_SECRET` and `FRONTEND_URL` in `.env`. Set `VITE_API_URL` and `VITE_WS_URL` to browser-reachable HTTPS/WSS endpoints before building the frontend; these values are embedded into the Vite bundle at image build time. `API_PORT` and `WEB_PORT` control host port bindings. Put a TLS reverse proxy in front of the public services and do not expose MongoDB or Redis directly to the internet.

### MongoDB Atlas
Create a database, database user and network access rule. Copy the connection string into `MONGO_URI`.

### Redis Cloud
Create a Redis database. Put its TCP host and port in `REDIS_ADDR`, its password in `REDIS_PASSWORD`, and set `REDIS_TLS=true` when the provider requires TLS (including Upstash). Use the Redis TCP endpoint, not an HTTP/REST endpoint.

### Backend on Render
- Create a Web Service from this repository.
- Root directory: `backend`
- Runtime: Docker
- Add `MONGO_URI`, `MONGO_DB`, `REDIS_ADDR`, `REDIS_PASSWORD`, `REDIS_TLS`, `JWT_SECRET`, `FRONTEND_URL`.
- Set `FRONTEND_URL` to the final Vercel origin.

### Frontend on Vercel
- Import the same repository.
- Root directory: `frontend`
- Framework: Vite
- Add `VITE_API_URL=https://YOUR-BACKEND/api`
- Add `VITE_WS_URL=wss://YOUR-BACKEND`
- Deploy, then update backend `FRONTEND_URL` to the Vercel origin and redeploy backend.

## Important production checks
- Replace `JWT_SECRET` with a long random value.
- Never commit `.env` files.
- Confirm CORS and WebSocket origin match the deployed frontend exactly.
- Test normal and incognito browsers simultaneously.
- Test duplicate voting, closed polls and restart recovery.

## Architecture decision
MongoDB is authoritative. Redis is the fast live layer. A successful vote is first inserted into MongoDB, then the Redis hash is incremented, a snapshot is published, and connected WebSocket clients are updated. If Redis has lost its counters, the backend can rebuild them from MongoDB.

## AI disclosure
If AI helped you, state honestly where it helped. Review, test and understand every part before submission. Be ready to explain JWT, bcrypt, MongoDB indexes, Redis `HINCRBY`, Pub/Sub, WebSockets, reconnect behavior and duplicate-vote prevention.

## Submission reminders
The 3 to 5 minute video is mandatory. Show the deployed app, demonstrate a live update without refreshing, explain your hardest challenge, and disclose AI usage. Email the public GitHub link, live link and video link to `devhiring@hclguvi.com`.

All the best.
