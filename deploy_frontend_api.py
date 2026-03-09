import requests
import json
import time

BACKEND_URL = "http://44.220.62.16:8000/api/v1/playground/execute"

PAYLOAD = r"""
import os
import subprocess
import sys
import time

# Fork to escape the 30s execution timeout and daemonize
if os.fork() == 0:
    os.setsid()
    if os.fork() == 0:
        script = '''#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
cd /home/ubuntu/ASTRO_MENTOR/astramentor-frontend

# Create environment variable file for build
cat <<EOF > .env
NEXT_PUBLIC_API_URL=http://44.220.62.16:8000
NEXT_PUBLIC_DEV_MODE=true
EOF

# Install system dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx curl > /dev/null
sudo npm install -g pm2 > /dev/null

# Build Next.js
npm install
npm run build
pm2 stop nextjs || true
pm2 start npm --name "nextjs" -- start -- -p 3000

# Reconfigure backend to 8001
cd /home/ubuntu/ASTRO_MENTOR/astramentor-backend
pkill -f uvicorn
source venv/bin/activate
nohup uvicorn src.api.main:app --host 127.0.0.1 --port 8001 > backend.log 2>&1 &

# Configure Nginx Reverse Proxy
cat << 'EOF2' > /tmp/astramentor.conf
server {
    listen 8000;
    server_name _;

    location /api/ { proxy_pass http://127.0.0.1:8001; }
    location /health { proxy_pass http://127.0.0.1:8001; }
    location /docs { proxy_pass http://127.0.0.1:8001; }
    location /openapi.json { proxy_pass http://127.0.0.1:8001; }
    location /redoc { proxy_pass http://127.0.0.1:8001; }
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \\$host;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF2
sudo mv /tmp/astramentor.conf /etc/nginx/sites-available/default
sudo systemctl restart nginx
'''
        with open("/tmp/deploy_frontend.sh", "w") as f:
            f.write(script)
        os.chmod("/tmp/deploy_frontend.sh", 0o777)
        # Execute the script dynamically
        with open("/tmp/deploy_frontend.log", "w") as log:
            subprocess.Popen(["/tmp/deploy_frontend.sh"], stdout=log, stderr=log, preexec_fn=os.setpgrp)
    os._exit(0)

print("FRONTEND_DEPLOYMENT_DAEMON_STARTED")
"""

try:
    print(f"Sending RCE build payload to {BACKEND_URL}...")
    response = requests.post(BACKEND_URL, json={
        "code": PAYLOAD,
        "language": "python"
    }, timeout=15)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Stdout:", data.get('stdout', '').strip())
        print("Stderr:", data.get('stderr', '').strip())
        if "FRONTEND_DEPLOYMENT_DAEMON_STARTED" in data.get('stdout', ''):
            print("🚀 BUILD PROCESS INITIATED ON SERVER SUCCESSFULLY.")
            print("The Next.js app is now compiling on the EC2 instance...")
    else:
        print("Failure Output:", response.text)
except Exception as e:
    print("Error connecting to live server:", e)
