import paramiko
import sys

hostname = "44.220.62.16"
port = 22
username = "ubuntu"
password = "AstraMentor2026!"

print(f"Connecting to {username}@{hostname}...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

script = """#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "Updating apt..."
sudo apt-get update -y > /dev/null

echo "Installing compilers and dependencies..."
sudo -E apt-get install -y default-jdk g++ gcc golang rustc ruby php redis-server python3-venv python3-pip git > /dev/null

echo "Cloning repository..."
if [ ! -d "ASTRO_MENTOR" ]; then
    git clone https://github.com/Bharathvelan/ASTRO_MENTOR.git
else
    echo "Directory ASTRO_MENTOR exists. Pulling latest..."
    cd ASTRO_MENTOR
    git pull
    cd ..
fi

echo "Setting up backend..."
cd ASTRO_MENTOR/astramentor-backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

echo "Installing pip requirements..."
./venv/bin/pip install -r requirements.txt > /dev/null

echo "Configuring environment..."
cat <<EOF > .env
DATABASE_URL=sqlite:///./astramentor.db
REDIS_URL=redis://localhost:6379
AWS_REGION=us-east-1
EOF

echo "Starting backend service forever..."
pkill -f uvicorn || true
nohup ./venv/bin/uvicorn src.api.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
echo "Deployment finished! Backend running."
"""

try:
    client.connect(hostname, port=port, username=username, password=password)
    print("Connected successfully!")
    
    print("Uploading deployment script...")
    sftp = client.open_sftp()
    with sftp.file('deploy.sh', 'w') as f:
        f.write(script)
    sftp.close()
    
    print("Executing deployment script... This will take a few minutes for the apt-get installs.")
    stdin, stdout, stderr = client.exec_command("chmod +x deploy.sh && ./deploy.sh", get_pty=True)
    
    for line in iter(lambda: stdout.readline(2048), ""):
        print(line, end="")
        sys.stdout.flush()
            
except Exception as e:
    print(f"Failed: {e}")
finally:
    client.close()
