# Use official Python image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project
COPY backend/ .

# Collect static files (optional if needed)
# RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Command to run Django server (used in docker-compose override)
CMD ["gunicorn", "src.wsgi:application", "--bind", "0.0.0.0:8000"]
