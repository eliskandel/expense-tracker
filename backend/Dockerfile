FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH=/app

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD ["gunicorn", "src.wsgi:application", "--bind", "0.0.0.0:8000"]
