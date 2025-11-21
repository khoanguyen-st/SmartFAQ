# FROM node:20-alpine

# WORKDIR /workspace

# # Enable yarn via corepack (Node 20+ có sẵn)
# RUN corepack enable

# # Copy dependency files first (for better caching)
# COPY apps/web-admin/package.json apps/web-admin/yarn.lock ./apps/web-admin/
# COPY packages/ui/package.json ./packages/ui/
# COPY packages/config ./packages/config/

# # Install dependencies cho packages/ui trước
# WORKDIR /workspace/packages/ui
# RUN yarn install --frozen-lockfile

# # Install dependencies cho web-admin
# WORKDIR /workspace/apps/web-admin
# RUN yarn install --frozen-lockfile

# # Copy source code
# WORKDIR /workspace
# COPY packages/ui ./packages/ui
# COPY apps/web-admin ./apps/web-admin

# # Set working directory
# WORKDIR /workspace/apps/web-admin

# EXPOSE 5173

# # Development server
# CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "5173"]


FROM node:20-alpine

WORKDIR /workspace

# Enable yarn via corepack
RUN corepack enable

# Copy root package.json và lockfile
COPY package.json yarn.lock ./

# Copy tất cả packages và apps metadata
COPY packages ./packages
COPY apps ./apps

# Ensure devDependencies are installed for development builds (so vite-plugin-svgr is present)
ENV NODE_ENV=development
# Install all dependencies (including devDependencies) from the monorepo root
RUN yarn install --frozen-lockfile

# Chọn working directory cho web-admin
WORKDIR /workspace/apps/web-admin

EXPOSE 5173

# Chạy dev server
CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "5173"]
