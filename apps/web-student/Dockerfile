FROM node:20-alpine

WORKDIR /workspace

# Copy package files
COPY package*.json ./
COPY apps/web-student/package*.json ./apps/web-student/
COPY packages/ui/package*.json ./packages/ui/

# Copy tsconfig files
COPY packages/config ./packages/config

# Install dependencies cho packages/ui trước
RUN npm install --prefix packages/ui

# Install dependencies cho web-student
RUN npm install --prefix apps/web-student

# Copy source code
COPY packages/ui ./packages/ui
COPY apps/web-student ./apps/web-student

WORKDIR /workspace/apps/web-student

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]