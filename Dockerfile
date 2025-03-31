FROM node

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@latest --activate \
    && pnpm --version

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

ENTRYPOINT [ "node", "dist/main.js" ]
