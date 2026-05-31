FROM python:3.11-slim

# Install system dependencies for PostGIS/GDAL (the map stuff)
RUN apt-get update && apt-get install -y \
    binutils \
    libproj-dev \
    gdal-bin \
    python3-gdal \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# We will create this file in the next step
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
