FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install


FROM base AS development

RUN mkdir -p /dist
RUN npm install cross-env && npm install -g @nestjs/cli
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont
      
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

EXPOSE 3000

CMD ["npm", "run", "start:dev"]


FROM base AS builder
COPY . .
ARG  NODE_ENV
ARG APP_AUTH_METHOD
ARG SECRET_KEY
ARG REFERER
ARG NAMESPACE
ARG AMPID
ARG PORT
ARG VALIDATOR
ARG CLIENT_ID
ARG REDIRECT_URI

ENV  NODE_ENV=$NODE_ENV
ENV APP_AUTH_METHOD=$APP_AUTH_METHOD
ENV SECRET_KEY=$SECRET_KEY
ENV REFERER=$REFERER
ENV NAMESPACE=$NAMESPACE
ENV AMPID=$AMPID
ENV PORT=$PORT
ENV VALIDATOR=$VALIDATOR
ENV CLIENT_ID=$CLIENT_ID
ENV REDIRECT_URI=$REDIRECT_URI
RUN npm run build


FROM node:20-alpine AS production

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont
      
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN npm install -g @puppeteer/browsers && npx @puppeteer/browsers install chrome


WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY ./monitor_db.json ./
COPY ./black-list.txt ./


EXPOSE 3000

CMD ["node", "dist/main.js"]