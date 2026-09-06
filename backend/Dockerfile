FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy hanya file yang dibutuhkan API (bukan frontend/)
COPY backend/config/ ./config/
COPY backend/helpers/ ./helpers/
COPY backend/services/ ./services/
COPY backend/templates/ ./templates/
COPY backend/api/ ./api/

# Port default Fastify
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "api/server.js"]
