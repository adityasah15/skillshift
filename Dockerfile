FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY nest-cli.json tsconfig*.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated

EXPOSE 3000

CMD ["node", "dist/src/main.js"]