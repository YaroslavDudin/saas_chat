# Stage 1: Build the widget
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the widget via Nginx
FROM nginx:alpine
# Copy the built widget.js to the default nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html
# Add custom nginx config to allow CORS (important for a widget!)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
