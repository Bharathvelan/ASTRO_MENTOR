import paramiko
import sys

hostname = "44.220.62.16"
port = 22
username = "ubuntu"
password = "AstraMentor2026!"

script = """#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "1. Installing Node.js (v20) and Nginx..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx curl > /dev/null

echo "2. Installing PM2 Process Manager..."
sudo npm install -g pm2 > /dev/null

echo "3. Building Next.js Frontend for Production..."
cd /home/ubuntu/ASTRO_MENTOR/astramentor-frontend
cat <<EOF > .env
NEXT_PUBLIC_API_URL=http://44.220.62.16:8000
NEXT_PUBLIC_DEV_MODE=true
EOF
npm install
npm run build

echo "4. Reconfiguring FastAPI Backend to local Port 8001..."
cd /home/ubuntu/ASTRO_MENTOR/astramentor-backend
pkill -f uvicorn || true
source venv/bin/activate
nohup uvicorn src.api.main:app --host 127.0.0.1 --port 8001 > backend.log 2>&1 &

echo "5. Starting Next.js Production Server on Port 3000..."
cd /home/ubuntu/ASTRO_MENTOR/astramentor-frontend
pm2 stop nextjs || true
pm2 start npm --name "nextjs" -- start -- -p 3000

echo "6. Configuring Nginx Reverse Proxy on Public Port 8000..."
cat << 'EOF' > /tmp/astramentor.conf
server {
    listen 8000;
    server_name _;

    # Route backend endpoints to FastAPI (8001)
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /health {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /docs {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /openapi.json {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /redoc {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Route everything else to Next.js Frontend (3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
sudo mv /tmp/astramentor.conf /etc/nginx/sites-available/default
sudo systemctl restart nginx

echo "FRONTEND_DEPLOYMENT_COMPLETE"
"""

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    print(f"Connecting to {username}@{hostname}...")
    client.connect(hostname, port=port, username=username, password=password)
    print("Connected successfully!")
    
    print("Uploading frontend deployment script...")
    sftp = client.open_sftp()
    with sftp.file('deploy_frontend.sh', 'w') as f:
        f.write(script)
    sftp.close()
    
    print("Executing deployment script... This will take 2-4 minutes for the Next.js build.")
    stdin, stdout, stderr = client.exec_command("chmod +x deploy_frontend.sh && ./deploy_frontend.sh", get_pty=True)
    
    for line in iter(lambda: stdout.readline(2048), ""):
        print(line, end="")
        sys.stdout.flush()
            
except Exception as e:
    print(f"Failed: {e}")
finally:
    client.close()
