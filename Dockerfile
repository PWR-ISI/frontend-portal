FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --legacy-peer-deps --silent

COPY . .
RUN npm run build

FROM nginx:stable-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
# optional: copy nginx.conf if you need SPA fallback
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
