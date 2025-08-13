# Use a lightweight Node.js base image
FROM node:20-alpine

# App dir
WORKDIR /app

# Prod defaults
ENV NODE_ENV=production \
    PORT=8081

# Install deps first (better layer caching)
COPY package*.json ./
# Use lockfile if present; fall back to npm install
RUN npm ci --omit=dev || npm install --omit=dev

# Copy the rest of the app (includes public/index.html)
COPY . .

# Expose the port the app listens on (matches Service/targetPort)
EXPOSE 8081

# Optional: basic healthcheck hitting /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD \
  wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1 || exit 1

# Start the server
CMD ["node", "server.js"]
