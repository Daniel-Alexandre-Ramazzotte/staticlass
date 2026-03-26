FROM python:3.12-slim

WORKDIR /app

# Instala dependências do sistema necessárias para PyMySQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala dependências Python primeiro (aproveita cache do Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instala gunicorn para produção (mais robusto que o servidor dev do Flask)
RUN pip install --no-cache-dir gunicorn

# Copia o código do backend
COPY . .

# Porta padrão do Gunicorn
EXPOSE 8080

# Produção: gunicorn com 4 workers
# Porta 8080 para Fly.io (PORT env var), 5000 para docker-compose local
CMD ["sh", "-c", "gunicorn --workers 4 --bind 0.0.0.0:${PORT:-5000} 'statl:create_app()'"]
