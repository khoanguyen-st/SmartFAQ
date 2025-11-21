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
