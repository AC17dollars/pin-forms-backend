# GIS Form Backend - Docker Deployment

## Quick Start

### Environment Variables Setup

**For Docker deployment, you need a separate `.env` file:**

1. **Copy the Docker environment template:**

   ```bash
   cp .env.docker.example .env
   ```

   > ⚠️ **Important:** This is different from your development `.env` file. Docker needs different MongoDB connection settings.

2. **Edit `.env` file with your credentials:**
   - `MONGO_ROOT_USERNAME` & `MONGO_ROOT_PASSWORD` - MongoDB credentials
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email settings (same as dev)
   - `BETTER_AUTH_SECRET` - Generate a random 32+ character string
   - `BETTER_AUTH_URL` - Update to your domain (e.g., `https://api.yourdomain.com`)

### Start Services

3. **Build and start services:**

   ```bash
   docker-compose up -d
   ```

4. **Check logs:**

   ```bash
   docker-compose logs -f backend
   ```

5. **Access the API:**
   - API Documentation: http://localhost:5000/scalar
   - Health Check: http://localhost:5000/api/health

## Environment Variables Explained

The `.env` file is used by docker-compose to configure both MongoDB and the backend:

- **MongoDB variables:** Used to create MongoDB root user
  - `MONGO_ROOT_USERNAME` - MongoDB admin username
  - `MONGO_ROOT_PASSWORD` - MongoDB admin password
- **Backend variables:** Passed to your application container
  - `SMTP_*` - Copy from your development `.env` file
  - `BETTER_AUTH_SECRET` - Generate new or copy from dev
  - `BETTER_AUTH_URL` - Update for production domain

> 💡 **Tip:** You can copy SMTP settings from your existing development `.env` file.

## Commands

- **Start services:** `docker-compose up -d`
- **Stop services:** `docker-compose down`
- **Rebuild:** `docker-compose up -d --build`
- **View logs:** `docker-compose logs -f [service_name]`
- **Clean everything:** `docker-compose down -v` (⚠️ deletes data!)

## Production Deployment

For production deployment:

1. Update `BETTER_AUTH_URL` in `.env` to your domain
2. Consider using a reverse proxy (nginx) for SSL/TLS
3. Use strong passwords for MongoDB
4. Set `NODE_ENV=production`
5. Configure proper backup for MongoDB volume

## Data Persistence

- MongoDB data: Stored in Docker volume `mongodb_data`
- File uploads: Stored in `./storage` directory (mounted as volume)

## Troubleshooting

- **MongoDB connection issues:** Ensure MongoDB is healthy with `docker-compose ps`
- **Backend crashes:** Check logs with `docker-compose logs backend`
- **Port conflicts:** Change port mappings in `docker-compose.yml`
