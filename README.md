# GIS Form Backend

A Hono-based backend service for managing GIS form data and map markers, featuring MongoDB persistence and Better Auth for authentication.

## Getting Started

### Prerequisites

- Node.js
- pnpm

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your MongoDB URI and other configuration details.

### Running the Project

**Development:**

```bash
pnpm dev
```

**Production Build:**

```bash
pnpm build
pnpm start
```
