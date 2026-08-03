FROM node:20-alpine
WORKDIR /app
COPY payments/package*.json ./
RUN npm ci --only=production
COPY payments/ ./
COPY utils/ ./utils/
EXPOSE 5002
CMD ["node", "index.js"]
