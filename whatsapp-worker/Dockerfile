# Chromium-ready Node base — includes the deps Puppeteer's bundled Chromium
# needs at runtime. Run as non-root, persist .wwebjs_auth via a volume.
FROM node:20-bookworm-slim

ENV PUPPETEER_SKIP_DOWNLOAD=false
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY index.js ./

# Session lives under /data so a mounted volume survives redeploys.
ENV SESSION_DIR=/data/wwebjs_auth
VOLUME ["/data"]

EXPOSE 8088
CMD ["node", "index.js"]
