FROM node:20-alpine AS builder
ARG VITE_MODE=full
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN if [ "$VITE_MODE" = "display" ]; then \
      npm run build:display; \
    else \
      npm run build; \
    fi

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
