# Multi-Language Dockerfile for LeetEval Backend
# Installs Node.js 20, Python 3, GCC (C), G++ (C++), and OpenJDK (Java) natively in the container image.

FROM node:20-slim

# Install C, C++, Java, and Python compilers
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    gcc \
    g++ \
    default-jdk-headless \
    make \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Verify compiler installations during Docker image build
RUN python3 --version && gcc --version && g++ --version && java -version && javac -version

# Set working directory inside container
WORKDIR /app

# Copy package manifests first for efficient docker caching
COPY package*.json ./

# Install backend production dependencies
RUN npm install --production

# Copy backend application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start backend application server
CMD ["node", "src/server.js"]
