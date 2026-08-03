FROM node:20-alpine
WORKDIR /app
COPY email/package*.json ./
RUN npm ci --only=production
COPY email/ ./
COPY utils/ ./utils/
EXPOSE 5001
CMD ["node", "index.js"]
