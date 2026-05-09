FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# --host нужен для того, чтобы Vite был доступен вне контейнера
CMD ["npm", "run", "dev", "--", "--host"]
