const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd());

const files = {
  // ROOT DOCKER-COMPOSE
  'docker-compose.yml': `version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: sw_db
    restart: always
    environment:
      POSTGRES_USER: \${DB_USER:-postgres}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-password}
      POSTGRES_DB: \${DB_NAME:-smart_workshop}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - sw_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sw_backend
    restart: always
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    environment:
      - DATABASE_URL=postgresql://\${DB_USER:-postgres}:\${DB_PASSWORD:-password}@db:5432/\${DB_NAME:-smart_workshop}
    volumes:
      - backend_uploads:/app/uploads
      - backend_logs:/app/logs
    networks:
      - sw_network

  frontend:
    build:
      context: ./smart-workshop
      dockerfile: Dockerfile
    container_name: sw_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - sw_network

volumes:
  pgdata:
  backend_uploads:
  backend_logs:

networks:
  sw_network:
    driver: bridge
`,
  // FRONTEND DOCKERFILE
  'smart-workshop/Dockerfile': `FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`,
  // FRONTEND NGINX
  'smart-workshop/nginx.conf': `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
`,
  // BACKEND DOCKERFILE
  'backend/Dockerfile': `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# Create standard directories for runtime
RUN mkdir -p uploads/assets uploads/documents logs
EXPOSE 5000
CMD ["npm", "start"]
`,
  // ROOT ENV EXAMPLE
  '.env.example': `# SMART WORKSHOP ENVIRONMENT TEMPLATE
# Global Database Config
DB_USER=postgres
DB_PASSWORD=SecurePassword123!
DB_NAME=smart_workshop
`,
  // BACKEND ENV EXAMPLE
  'backend/.env.example': `PORT=5000
DATABASE_URL=postgresql://postgres:SecurePassword123!@db:5432/smart_workshop
JWT_SECRET=production-secret-key-change-me
JWT_REFRESH_SECRET=production-refresh-key-change-me
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGIN=http://localhost
`,
  // FRONTEND ENV EXAMPLE
  'smart-workshop/.env.example': `VITE_API_URL=http://localhost:5000/api
`,
  // GITHUB ACTIONS CI/CD
  '.github/workflows/deploy.yml': `name: Smart Workshop CI/CD

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Backend Dependencies
        working-directory: ./backend
        run: npm ci

      - name: Install Frontend Dependencies
        working-directory: ./smart-workshop
        run: npm ci

      - name: Build Frontend
        working-directory: ./smart-workshop
        run: npm run build

      # Add testing steps here (npm test)
      
  docker-build:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker Compose Stack
        run: docker-compose build
`,
  // DOCUMENTATION
  'docs/Deployment_Guide.md': `# Deployment Guide

## Prerequisites
- Docker Engine & Docker Compose installed.
- Git installed.
- Access to ports \`80\` and \`5000\`.

## Quick Start
1. Clone the repository.
2. Copy environment templates:
   \`\`\`bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp smart-workshop/.env.example smart-workshop/.env
   \`\`\`
3. Edit the \`.env\` files with production secrets (change JWT keys, Database passwords).
4. Run the stack:
   \`\`\`bash
   docker-compose up -d --build
   \`\`\`
5. Apply database migrations:
   \`\`\`bash
   docker-compose exec backend npm run db:push
   \`\`\`

The frontend will be available at \`http://localhost\` and the API at \`http://localhost:5000\`.
`,
  'docs/Security_Checklist.md': `# Production Security Checklist

- [ ] **HTTPS/TLS**: Ensure the server sits behind a reverse proxy (like Nginx/HAProxy/AWS ALB) configured with SSL certificates.
- [ ] **CORS Settings**: Restrict \`CORS_ORIGIN\` in \`backend/.env\` to the exact frontend domain.
- [ ] **Strong Passwords**: Change \`DB_PASSWORD\` and all \`JWT_SECRET\` keys from the default templates.
- [ ] **Firewall**: Restrict port \`5432\` (DB) and \`5000\` (API) so they are only accessible internally or by the load balancer. Port \`80\`/\`443\` should be the only exposed ports.
- [ ] **Rate Limiting**: Currently configured to 100 requests / 15 mins for Auth. Adjust as needed.
- [ ] **Helmet**: Helmet is enabled on the backend to enforce secure HTTP headers and basic Content Security Policies (CSP).
`,
  'docs/Backup_Recovery_Strategy.md': `# Backup & Disaster Recovery Strategy

## Database Backups
PostgreSQL is orchestrated via Docker. To create a backup dump, run:
\`\`\`bash
docker-compose exec -t db pg_dump -U postgres smart_workshop -F c > backup_\$(date +%Y%m%d).dump
\`\`\`

### Cron Job Automation
Set up a daily cron job at 02:00 AM on the host machine:
\`\`\`text
0 2 * * * /usr/local/bin/docker-compose -f /path/to/repo/docker-compose.yml exec -T db pg_dump -U postgres smart_workshop -F c > /path/to/backups/db_\$(date +\\%Y\\%m\\%d).dump
\`\`\`

## File Uploads Backup
Asset images and documents are stored in the \`backend_uploads\` docker volume. 
Archive them regularly:
\`\`\`bash
tar -czvf uploads_backup_\$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/repo_backend_uploads/_data
\`\`\`
`,
  'docs/Monitoring_Guide.md': `# Monitoring & Logging

## Backend Logs
The backend uses **Winston** for file logging and **Morgan** for HTTP logging.
- Error logs: Inside the container at \`/app/logs/error.log\`
- Access logs: Inside the container at \`/app/logs/combined.log\`

To view logs in real-time from Docker:
\`\`\`bash
docker-compose logs -f backend
\`\`\`

## Health Checks
- **API Status**: \`GET http://localhost:5000/api/health\`
- **Database Status**: The docker-compose file inherently tracks Postgres health using \`pg_isready\`.
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('DevOps files generated.');
