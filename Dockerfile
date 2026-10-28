FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    (npm ci || (sleep 5 && npm ci) || (sleep 10 && npm ci))

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_SU_API_URL
ARG VITE_SU_API_KEY
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SU_API_URL=${VITE_SU_API_URL}
ENV VITE_SU_API_KEY=${VITE_SU_API_KEY}

RUN npm run build

ENV CI=true
ENV WRANGLER_SEND_METRICS=false

EXPOSE 8787

CMD ["npx", "wrangler", "dev", "--ip", "0.0.0.0", "--port", "8787"]
