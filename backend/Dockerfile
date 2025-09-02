# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container to /usr/src/app
WORKDIR /usr/src/app

# Set environment variables to prevent Python from writing .pyc files and to use an unbuffered stdout/stderr stream
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install any dependencies specified in requirements.txt
# We copy requirements.txt first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application's source code to the working directory
COPY . .

# Expose port 8000 for the Django development server
EXPOSE 8000

# Command to run the Django development server
# This is the default command, but it will be overridden by docker-compose
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
