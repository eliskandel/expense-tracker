# Use Node image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/rupaiyaa-new/package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY frontend/rupaiyaa-new/ .

# Expose Metro bundler port
EXPOSE 8081

# Start Metro
CMD ["npx", "react-native", "start"]
