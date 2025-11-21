FROM node:20-alpine

WORKDIR /workspace

RUN corepack enable

COPY package.json yarn.lock ./

COPY packages ./packages
COPY apps ./apps

ENV NODE_ENV=development
RUN yarn install --frozen-lockfile

WORKDIR /workspace/apps/web-admin

EXPOSE 5173

CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "5173"]
