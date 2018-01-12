#!/bin/bash

# Populate env vars
if [ -e .env ]; then
    source .env
else
    echo ".env file is missing"
    exit 1
fi

# Download the latest template file
curl https://raw.githubusercontent.com/jwilder/nginx-proxy/master/nginx.tmpl > nginx.tmpl

# Update images
docker-compose pull

# Destroy existing containers
docker-compose down

# Start the fireworks
docker-compose up -d

# All done!
exit 0
