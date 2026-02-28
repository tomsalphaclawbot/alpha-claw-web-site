FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY content ./content
COPY public ./public
RUN chmod -R a+rX /app

EXPOSE 8080
USER node

CMD ["node", "server.js"]
