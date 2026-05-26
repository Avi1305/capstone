# DevSandbox AI

An AI-powered cloud IDE that spins up isolated Kubernetes sandboxes and builds frontend applications from natural language descriptions. Users describe what they want to build, and a LangChain agent powered by Mistral Large reads, generates, and writes code directly into a live, containerized development environment with real-time preview, terminal access, and file exploration.

---

## Architecture

```
                                    ┌─────────────────────────────────────────────┐
                                    │              Amazon CloudFront               │
                                    │   (CDN, SSL termination, static assets)      │
                                    └──────────────────┬──────────────────────────┘
                                                       │
                          ┌────────────────────────────┼────────────────────────────┐
                          │                            │                            │
                          ▼                            ▼                            ▼
                 ┌────────────────┐          ┌─────────────────┐         ┌─────────────────┐
                 │   S3 Bucket    │          │  ALB / NGINX    │         │  S3 Bucket      │
                 │ (Frontend SPA) │          │   Ingress       │         │ (User Assets)   │
                 └────────────────┘          └────────┬────────┘         └─────────────────┘
                                                      │
                              ┌────────────────────────┼────────────────────────┐
                              │                        │                        │
                              ▼                        ▼                        ▼
                     ┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
                     │   Frontend      │    │  AI Orchestration│    │  Sandbox Server  │
                     │  (React/Vite)   │    │  (LangChain +    │    │  (K8s Lifecycle  │
                     │   Port 5173     │    │   Mistral Large) │    │   Manager)       │
                     └─────────────────┘    │   Port 3000      │    │   Port 3000      │
                                            └────────┬─────────┘    └────────┬─────────┘
                                                     │                       │
                                                     │         ┌─────────────┤
                                                     │         │             │
                                                     ▼         ▼             ▼
                                            ┌──────────────────┐   ┌──────────────────────┐
                                            │  Auth Service    │   │  AWS EKS Cluster     │
                                            │  (JWT + Redis)   │   │                      │
                                            │  Port 3000       │   │  ┌────────────────┐  │
                                            └──────────────────┘   │  │ Dynamic Sandbox │  │
                                                     │             │  │ Pods            │  │
                                                     │             │  │ ┌─────────────┐│  │
                                            ┌────────┴───────┐    │  │ │  Template   ││  │
                                            │  Notification  │    │  │ │  (Vite)     ││  │
                                            │  Service       │    │  │ ├─────────────┤│  │
                                            │  (WebSocket)   │    │  │ │   Agent     ││  │
                                            │  Port 3000     │    │  │ │ (Files+PTY) ││  │
                                            └────────────────┘    │  │ └─────────────┘│  │
                                                                  │  └────────────────┘  │
                                                                  │          ▲           │
                                                                  │          │           │
                                                                  │  ┌───────┴────────┐  │
                                                                  │  │  Redis         │  │
                                                                  │  │  (Sandbox      │  │
                                                                  │  │   Registry +   │  │
                                                                  │  │   TTL/Idle     │  │
                                                                  │  │   Tracking)    │  │
                                                                  │  └────────────────┘  │
                                                                  │  ┌────────────────┐  │
                                                                  │  │  Router        │  │
                                                                  │  │  (Host-based   │  │
                                                                  │  │   Proxy)       │  │
                                                                  │  └────────────────┘  │
                                                                  └──────────────────────┘
```

---

## Services

| Service | Path | Description |
|---|---|---|
| **Frontend** | `/frontend` | React 19 + Vite 8 SPA with AI chat, live preview, file explorer, and terminal |
| **AI Orchestration** | `/ai-orchestration` | LangChain agent with Mistral Large — reads/writes sandbox files via tool use, streams responses via SSE |
| **Sandbox Server** | `/sandbox/server` | Lifecycle manager — creates/deletes K8s Pods and Services dynamically via the K8s API |
| **Sandbox Agent** | `/sandbox/agent` | Runs inside each sandbox pod — file CRUD API + live terminal via node-pty + Socket.IO |
| **Router** | `/sandbox/router` | Host-based reverse proxy — routes `{sandboxId}.preview.localhost` and `{sandboxId}.agent.localhost` to the correct pod |
| **Template** | `/sandbox/template` | Minimal React+Vite starter project seeded into each new sandbox via init container |
| **Auth** | `/auth` | JWT-based authentication with Redis session management |
| **Notification** | `/notification` | Real-time notification service via WebSocket |

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Zustand, xterm.js, Socket.IO, react-markdown |
| **AI Engine** | LangChain, LangGraph, Mistral AI (mistral-large-latest), Zod |
| **Backend** | Node.js 20, Express 5, Socket.IO, node-pty, Mongoose |
| **Auth** | JWT (jsonwebtoken), bcrypt, Redis (session store + token blacklist) |
| **Notifications** | WebSocket (Socket.IO), Redis Pub/Sub |
| **Infrastructure** | AWS EKS, NGINX Ingress, CloudFront, ECR, S3, Skaffold |
| **Data** | MongoDB (user data, sandbox metadata), Redis (sessions, sandbox registry, idle tracking) |
| **Container Runtime** | Docker, Kubernetes (pod-per-sandbox isolation) |

---

## How It Works

### Sandbox Creation Flow

```
User clicks "Start Sandbox"
       │
       ▼
Frontend ──POST /api/sandbox/start──▶ Sandbox Server
       │                                    │
       │                           Generates UUID
       │                                    │
       │                     ┌──────────────┼──────────────┐
       │                     ▼              ▼              ▼
       │               Create Pod    Create Service   Register in Redis
       │                     │                           │
       │              ┌──────┴──────┐              Sandbox ID +
       │              │ Init Container│             TTL + idle timer
       │              │ (copies template)│
       │              ├─────────────┤
       │              │  Sandbox    │
       │              │  (Vite :5173)│
       │              ├─────────────┤
       │              │  Agent      │
       │              │  (API :3000)│
       │              └─────────────┘
       │
       ◀── { sandboxId, previewUrl } ──┘
```

### AI Chat Flow

```
User types message in chat
       │
       ▼
Frontend ──POST /api/ai/agent/invoke (SSE)──▶ AI Orchestration
       │                                            │
       │                                    LangChain Agent
       │                                    (Mistral Large)
       │                                            │
       │                              ┌─────────────┼─────────────┐
       │                              ▼             ▼             ▼
       │                         list-files    read-files    update-files
       │                              │             │             │
       │                              └──────┬──────┘             │
       │                                     ▼                    ▼
       │                          HTTP calls to sandbox agent (:3000)
       │                                     │
       │                              ◀── file contents ──┘
       │
       ◀── SSE stream (tool narration + response) ──┘
```

### Sandbox Idle Management (Redis)

```
┌─────────────────────────────────────────────────────────┐
│                    Redis Keys                            │
├─────────────────────────────────────────────────────────┤
│ sandbox:{id}:meta       → { userId, createdAt, status } │
│ sandbox:{id}:last_active → timestamp                    │
│ sandbox:{id}:ttl        → seconds until auto-cleanup    │
│ user:{id}:sandboxes     → Set of active sandbox IDs     │
│ sandbox:active           → Sorted set (score = last active) │
└─────────────────────────────────────────────────────────┘

Idle Check (runs periodically):
  1. ZRANGEBYSCORE sandbox:active 0 (now - IDLE_THRESHOLD)
  2. For each idle sandbox:
     - Delete K8s Pod + Service
     - Remove from Redis
     - Send notification to user via Notification Service
```

---

## AWS Deployment Architecture

### EKS Cluster

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS EKS Cluster                          │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  System Node      │  │  App Nodes       │  │ Sandbox Nodes│  │
│  │  Group            │  │  Group           │  │ Group        │  │
│  │                   │  │                  │  │              │  │
│  │  - NGINX Ingress  │  │  - Frontend      │  │  - Dynamic   │  │
│  │  - Redis          │  │  - AI Orchest.   │  │    Sandbox   │  │
│  │  - MongoDB        │  │  - Auth Service  │  │    Pods      │  │
│  │  - Router         │  │  - Notification  │  │    (N pods)  │  │
│  │  - Sandbox Server │  │  - Sandbox Server│  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Kubernetes Resources                                     │  │
│  │                                                           │  │
│  │  Deployments:  ai-deployment (2 replicas)                 │  │
│  │                sandbox-deployment (1 replica)             │  │
│  │                router-deployment (1 replica)              │  │
│  │                auth-deployment (2 replicas)               │  │
│  │                notification-deployment (2 replicas)       │  │
│  │                                                           │  │
│  │  Services:     ai-service, sandbox-service, router-service│  │
│  │                auth-service, notification-service         │  │
│  │                                                           │  │
│  │  RBAC:         resource-manager ServiceAccount            │  │
│  │                (create/delete pods + services)            │  │
│  │                                                           │  │
│  │  Ingress:      NGINX Ingress Controller                   │  │
│  │                *.preview.localhost → router               │  │
│  │                *.agent.localhost → router                 │  │
│  │                /api/sandbox/* → sandbox-service           │  │
│  │                /api/ai/* → ai-service                     │  │
│  │                /api/auth/* → auth-service                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### CloudFront Distribution

```
CloudFront Distribution
       │
       ├── /static/*  ──▶  S3 Bucket (Frontend SPA assets)
       │                    (React build output, cached at edge)
       │
       ├── /api/*     ──▶  ALB / NGINX Ingress (EKS)
       │                    (auth, sandbox, AI, notification APIs)
       │
       ├── /socket.io ──▶  ALB / NGINX Ingress (EKS)
       │                    (WebSocket upgrade for terminal + notifications)
       │
       └── /*         ──▶  S3 Bucket (Frontend SPA index.html)
                            (SPA fallback routing)
```

### ECR Repositories

```
┌─────────────────────────────────────┐
│         Amazon ECR                   │
├─────────────────────────────────────┤
│  devsandbox/ai-orchestration        │
│  devsandbox/sandbox-server          │
│  devsandbox/sandbox-agent           │
│  devsandbox/sandbox-router          │
│  devsandbox/sandbox-template        │
│  devsandbox/frontend                │
│  devsandbox/auth                    │
│  devsandbox/notification            │
└─────────────────────────────────────┘

Tag strategy: git SHA (sha256) for immutability
```

---

## Auth Service

JWT-based authentication with Redis-backed session management.

```
┌──────────────────────────────────────────────────────┐
│                   Auth Service                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  POST /api/auth/register                             │
│    → Hash password (bcrypt)                          │
│    → Create user in MongoDB                          │
│    → Return JWT access token + refresh token         │
│                                                      │
│  POST /api/auth/login                                │
│    → Verify credentials                              │
│    → Generate JWT (15m expiry)                       │
│    → Store refresh token in Redis (7d expiry)        │
│    → Return { accessToken, refreshToken }            │
│                                                      │
│  POST /api/auth/refresh                              │
│    → Validate refresh token against Redis            │
│    → Issue new access token                          │
│    → Rotate refresh token                            │
│                                                      │
│  POST /api/auth/logout                               │
│    → Blacklist access token in Redis (TTL = remaining│
│       token lifetime)                                │
│    → Delete refresh token from Redis                 │
│                                                      │
│  Middleware: authenticateToken                        │
│    → Check Authorization: Bearer <token>             │
│    → Verify not blacklisted (Redis check)            │
│    → Attach user to req.user                         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Redis Keys:**
- `session:{userId}:{tokenId}` → refresh token metadata (TTL: 7 days)
- `blacklist:{jti}` → blacklisted access tokens (TTL: token remaining lifetime)
- `user:{email}:attempts` → login attempt counter for brute-force protection

---

## Notification Service

Real-time notifications via Socket.IO with Redis Pub/Sub for multi-instance support.

```
┌─────────────────────────────────────────────────────────┐
│                 Notification Service                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Socket.IO Events:                                      │
│    → connect (JWT auth handshake)                       │
│    → subscribe:{userId} (join user room)                │
│    → notification (push to connected clients)           │
│                                                         │
│  Redis Pub/Sub:                                         │
│    → Channel: notifications:{userId}                    │
│    → Payload: { type, message, sandboxId, timestamp }   │
│                                                         │
│  Notification Types:                                    │
│    → sandbox.created  (sandbox ready)                   │
│    → sandbox.idle     (sandbox about to be cleaned up)  │
│    → sandbox.deleted  (sandbox cleaned up)              │
│    → ai.completed     (AI agent finished generating)    │
│    → ai.error         (AI agent encountered an error)   │
│    → auth.login       (new login from another device)   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
capstone/
├── frontend/                  # React SPA — IDE interface
│   ├── src/
│   │   ├── api/               # API clients (sandbox, ai, files, auth)
│   │   ├── components/
│   │   │   ├── landing/       # Landing page
│   │   │   ├── layout/        # IDE layout (sidebar, preview, terminal, chat)
│   │   │   └── auth/          # Login/register forms
│   │   ├── hooks/             # Custom hooks (AI stream, terminal socket)
│   │   └── store/             # Zustand state management
│   └── Dockerfile
│
├── ai-orchestration/          # AI agent service
│   ├── src/
│   │   ├── agents/            # LangChain agent + tools (list, read, update files)
│   │   └── routes/            # SSE streaming endpoint
│   └── Dockerfile
│
├── auth/                      # Authentication service
│   ├── src/
│   │   ├── controllers/       # Login, register, refresh, logout
│   │   ├── middleware/        # JWT verification, rate limiting
│   │   ├── models/            # User model (MongoDB)
│   │   └── routes/            # Auth routes
│   └── Dockerfile
│
├── notification/              # Notification service
│   ├── src/
│   │   ├── handlers/          # Socket.IO event handlers
│   │   ├── pubsub/            # Redis Pub/Sub subscriber
│   │   └── routes/            # REST endpoint for publishing notifications
│   └── Dockerfile
│
├── sandbox/
│   ├── server/                # Sandbox lifecycle manager
│   │   ├── src/
│   │   │   ├── kubernetes/    # K8s pod + service creation
│   │   │   ├── redis/         # Sandbox registry + idle tracking
│   │   │   └── routes/        # Start/stop/status endpoints
│   │   └── Dockerfile
│   │
│   ├── agent/                 # Runs inside each sandbox pod
│   │   ├── src/
│   │   │   └── app.js         # File API + PTY terminal + Socket.IO
│   │   └── Dockerfile
│   │
│   ├── router/                # Host-based reverse proxy
│   │   ├── src/
│   │   │   └── app.js         # HTTP + WebSocket proxy routing
│   │   └── Dockerfile
│   │
│   └── template/              # Seed React+Vite project
│       ├── src/
│       └── Dockerfile
│
├── k8s/                       # Kubernetes manifests
│   ├── ai-deployment.yml
│   ├── ai-service.yml
│   ├── sandbox-deployment.yml
│   ├── sandbox-service.yml
│   ├── router-deployment.yml
│   ├── router-service.yml
│   ├── auth-deployment.yml
│   ├── auth-service.yml
│   ├── notification-deployment.yml
│   ├── notification-service.yml
│   ├── ingress.yml
│   └── rbac.yml
│
└── skaffold.yml               # Local K8s dev workflow
```

---

## Getting Started

### Prerequisites

- Docker
- kubectl
- Skaffold
- AWS CLI (for EKS deployment)
- A Mistral AI API key

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/devsandbox-ai.git
cd devsandbox-ai

# Create the AI secret
kubectl create secret generic ai-secret --from-literal=MISTRAL_API_KEY=your_key_here

# Start all services with Skaffold
skaffold dev
```

The frontend will be available at `http://localhost`. Skaffold handles building all 8 Docker images and deploying them to your local K8s cluster with hot-reload.

### AWS EKS Deployment

```bash
# 1. Create EKS cluster
eksctl create cluster \
  --name devsandbox \
  --region ap-south-1 \
  --nodegroup-name sandbox-nodes \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10

# 2. Create ECR repositories
for service in ai-orchestration sandbox-server sandbox-agent sandbox-router sandbox-template frontend auth notification; do
  aws ecr create-repository --repository-name devsandbox/$service --region ap-south-1
done

# 3. Build and push images
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com

skaffold build --file-output=tags.json

# 4. Create secrets
kubectl create secret generic ai-secret --from-literal=MISTRAL_API_KEY=your_key
kubectl create secret generic auth-secret --from-literal=JWT_SECRET=your_secret
kubectl create secret generic redis-secret --from-literal=REDIS_URL=redis://redis-service:6379

# 5. Deploy
skaffold run -f tags.json

# 6. Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/aws/deploy.yaml

# 7. Set up CloudFront distribution pointing to ALB
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

---

## Environment Variables

| Variable | Service | Description |
|---|---|---|
| `MISTRAL_API_KEY` | ai-orchestration | Mistral AI API key |
| `MONGODB_URI` | sandbox-server, auth | MongoDB connection string |
| `REDIS_URL` | auth, notification, sandbox-server | Redis connection string |
| `JWT_SECRET` | auth | Secret for signing JWTs |
| `JWT_REFRESH_SECRET` | auth | Secret for refresh tokens |
| `IDLE_TIMEOUT` | sandbox-server | Seconds before idle sandbox cleanup (default: 1800) |
| `S3_BUCKET` | frontend, sandbox-server | S3 bucket for static assets |
| `CLOUDFRONT_DISTRIBUTION_ID` | frontend | CloudFront distribution for cache invalidation |
| `ECR_REGISTRY` | skaffold.yml | ECR registry URL |

---

## Key Design Decisions

**Pod-per-sandbox isolation** — Each user sandbox is a dedicated Kubernetes Pod with its own containers. This provides strong resource isolation and allows independent lifecycle management. The sandbox-server creates pods dynamically via the K8s API using a scoped RBAC ServiceAccount.

**Shared emptyDir volume** — Each sandbox pod uses an `emptyDir` volume at `/workspace`. The init container seeds it from the template image, and both the Vite container and agent container mount the same volume, so file changes by the AI are immediately visible to the dev server.

**Redis for sandbox registry** — Tracks active sandboxes, last activity timestamps, and TTLs. Enables idle cleanup, user-to-sandbox mapping, and prevents orphaned resources if the sandbox-server restarts.

**SSE over WebSockets for AI streaming** — AI responses are unidirectional (server → client), making SSE simpler and more reliable than WebSocket for this use case. Socket.IO is used only for the bidirectional terminal and notification channels.

**Host-based routing** — `{sandboxId}.preview.localhost` and `{sandboxId}.agent.localhost` subdomains allow multiple sandboxes to coexist behind a single ingress, with the router service handling proxy logic.

---

## License

MIT
