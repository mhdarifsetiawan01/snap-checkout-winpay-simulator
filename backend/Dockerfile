FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy hanya file yang dibutuhkan API (bukan frontend/)
COPY config/ ./config/
COPY helpers/ ./helpers/
COPY services/ ./services/
COPY templates/ ./templates/
COPY api/ ./api/

# Port default Fastify
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "api/server.js"]
