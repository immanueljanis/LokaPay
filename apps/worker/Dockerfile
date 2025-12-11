FROM oven/bun:1 AS base
WORKDIR /usr/src/app

COPY package.json ./
RUN bun install

COPY . .

WORKDIR /usr/src/app/packages/database
RUN bun x prisma generate

WORKDIR /usr/src/app/apps/worker

CMD ["bun", "run", "src/index.ts"]