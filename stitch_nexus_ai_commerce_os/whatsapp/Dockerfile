FROM node:20-alpine
WORKDIR /app
COPY whatsapp/package*.json ./
RUN npm ci --only=production
COPY whatsapp/ ./
COPY utils/ ./utils/
EXPOSE 5000
CMD ["node", "index.js"]
