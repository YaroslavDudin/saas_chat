# Используем официальный легковесный образ Python
FROM python:3.11-slim

# Установка переменных окружения для оптимизации работы Python в Docker
# Запрещает Python записывать файлы .pyc на диск
ENV PYTHONDONTWRITEBYTECODE=1
# Запрещает Python буферизовать stdout и stderr
ENV PYTHONUNBUFFERED=1

# Установка рабочей директории
WORKDIR /app

# Установка системных зависимостей (если понадобятся для сборки некоторых пакетов)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копирование и установка зависимостей Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Копирование проекта
COPY . /app/

# Открываем порт 8000
EXPOSE 8000
