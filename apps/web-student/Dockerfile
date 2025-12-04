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

# Build widget initially (creates public/chat-widget.js)
RUN yarn build-widget

EXPOSE 5173

# Use entrypoint script to rebuild widget on start (for volume-mounted code)
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "5173"]