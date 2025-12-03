FROM node:20-alpine

WORKDIR /app

# Enable yarn via corepack (Node 20+ có sẵn)
RUN corepack enable
RUN apk update && apk add --no-cache ca-certificates

# Copy package files for caching
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install
# Copy source code
COPY . .

EXPOSE 5173

# Development server
CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "5173"]