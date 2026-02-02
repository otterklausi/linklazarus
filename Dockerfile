# Simple Dockerfile for Railway/Fly.io/Render
FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend/ ./backend/

EXPOSE 3001

CMD ["sh", "/app/backend/start.sh"]