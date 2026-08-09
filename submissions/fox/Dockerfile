# Use a lightweight official Python image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Install the rply library directly
RUN pip install --no-cache-dir rply

# Copy your Python script into the container
COPY . .

# Run your Python program
CMD ["python", "src/fox.py"]
