FROM node:20-alpine

WORKDIR /app

RUN corepack enable

# Copy workspace root files
COPY package.json yarn.lock ./

# Copy dependency files first (for better caching)
COPY apps/web-admin/package.json ./apps/web-admin/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config ./packages/config/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

EXPOSE 5173

CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "5173"]
