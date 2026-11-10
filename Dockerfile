FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./

FROM base AS development
RUN npm ci

# Instalar Chromium e dependências de sistema necessárias para o Playwright no Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    dbus \
    libstdc++

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]


FROM base AS builder
COPY . .
RUN npm ci && \
    npm run build


FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV HOME=/tmp

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    dbus \
    libstdc++

RUN mkdir -p error-log && chown -R node:node /app
RUN mkdir -p storage && chown -R node:node /app/storage
RUN mkdir -p storage/evaluations && chown -R node:node /app/storage/evaluations

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

USER node

EXPOSE 3000


CMD ["node", "dist/main.js"]