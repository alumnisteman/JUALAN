FROM node:20-alpine
WORKDIR /app
COPY webhook/package*.json ./
RUN npm ci --only=production
COPY webhook/ ./
COPY utils/ ./utils/
EXPOSE 4000
CMD ["node", "index.js"]
