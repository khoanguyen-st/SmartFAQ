FROM node:20-alpine

WORKDIR /workspace

# Copy package files
COPY package*.json ./
COPY apps/web-admin/package*.json ./apps/web-admin/
COPY packages/ui/package*.json ./packages/ui/

# Copy tsconfig files (copy toàn bộ thư mục config)
COPY packages/config ./packages/config

# Install dependencies cho packages/ui trước
RUN npm install --prefix packages/ui

# Install dependencies cho web-admin
RUN npm install --prefix apps/web-admin

# Copy source code
COPY packages/ui ./packages/ui
COPY apps/web-admin ./apps/web-admin

WORKDIR /workspace/apps/web-admin

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]