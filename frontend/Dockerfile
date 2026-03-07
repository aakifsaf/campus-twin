# Build stage
FROM node:20-bullseye AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Expose dev server port
EXPOSE 5173 

# Run dev server with hot reload 
CMD ["npm", "run", "dev"]