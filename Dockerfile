# Simple Dockerfile for Railway/Fly.io/Render
FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

EXPOSE 3001

CMD ["node", "server.js"]