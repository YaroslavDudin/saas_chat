FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5174
# Принудительно задаем порт 5174 и --host
CMD ["npm", "run", "dev", "--", "--host", "--port", "5174"]
