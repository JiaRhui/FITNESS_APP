FROM node:20-alpine

WORKDIR /app

# Install only production dependencies, then clear the npm cache so it isn't
# baked into the final image layer. Rebuild with --pull to ensure the
# node:20-alpine base is the latest patched version.
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
