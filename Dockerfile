# Single-container build: Vite frontend built to static assets, served by
# the same Express process that hosts /api and the CopilotKit runtime.
# See PROTOTYPE_PLAN.md §9 — no database in this prototype (persistence is
# runs/runs.jsonl, mounted as a volume in docker-compose.yml). If a real DB
# is added later, this is the place to add its client dependency.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY .env.example ./.env.example

EXPOSE 8787
CMD ["node", "server/index.js"]
