# Use official Node.js LTS image
FROM node:20-bullseye

# Install liblouis for Braille conversion
RUN apt-get update && apt-get install -y liblouis-bin && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install Node dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the port (Render will set $PORT environment variable)
EXPOSE 5000

# Set environment variable for Node
ENV NODE_ENV=production

# Start the app
CMD ["npm", "start"]
