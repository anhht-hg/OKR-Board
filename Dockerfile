FROM node:22-alpine

# sqlite3 CLI needed by entrypoint to bootstrap db on first run
RUN apk add --no-cache sqlite

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Make entrypoint executable
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENV NODE_ENV=production
# DB lives on the mounted volume; entrypoint bootstraps it if empty
ENV DATABASE_URL=file:/app/data/dev.db
ENV DB_PATH=/app/data/dev.db

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
