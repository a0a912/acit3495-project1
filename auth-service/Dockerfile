# ---------- Dockerfile ----------
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy dependency list first for layer caching
COPY package.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY src ./src
COPY sql ./sql

# Expose the app port
EXPOSE 3000

# Default environment
ENV NODE_ENV=production

# Start the service
CMD ["node", "src/server.js"]
