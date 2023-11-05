# Use a base image with Node.js and Chrome installed
FROM browserless/chrome:latest

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install app dependencies
RUN npm install

# Expose the port the app runs on
EXPOSE 3000

# Define environment variable for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Run app.js when the container launches
CMD ["npm", "start"]