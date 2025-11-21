FROM node:20-alpine

WORKDIR /workspace

# Enable yarn via corepack (Node 20+ có sẵn)
RUN corepack enable

# Copy workspace root files
COPY package.json yarn.lock ./

# Copy dependency files first (for better caching)
COPY apps/web-student/package.json ./apps/web-student/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config ./packages/config/

# Install dependencies cho packages/ui trước
WORKDIR /workspace/packages/ui
RUN yarn install --frozen-lockfile

# Install dependencies cho web-student
WORKDIR /workspace/apps/web-student
RUN yarn install --frozen-lockfile

# Copy source code
WORKDIR /workspace
COPY packages/ui ./packages/ui
COPY apps/web-student ./apps/web-student

# Set working directory
WORKDIR /workspace/apps/web-student

EXPOSE 5173

# Development server
CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "5173"]