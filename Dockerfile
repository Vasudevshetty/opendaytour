FROM node:18-alpine AS build
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies
COPY package*.json ./
RUN npm ci --silent --include=dev

# Copy source and build
COPY . .
RUN npm run build

FROM nginx:stable-alpine

# Copy built files and nginx config
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
