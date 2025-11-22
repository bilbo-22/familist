# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Vite requires the API key at build time
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ARG VITE_APP_PASSWORD
ENV VITE_APP_PASSWORD=$VITE_APP_PASSWORD
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
# Copy empty database as a starting point if volume is empty
COPY --from=builder /app/database.json ./

EXPOSE 3001
CMD ["node", "server.js"]
