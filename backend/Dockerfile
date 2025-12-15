FROM python:3.11-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar requirements y instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código
COPY . .

# Exponer puerto 8000
EXPOSE 8000

# Comando para iniciar (se ejecutará en producción)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "registrame.wsgi:application"]