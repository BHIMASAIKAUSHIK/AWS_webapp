#!/bin/bash

if [ -z "$BASH_VERSION" ]; then
    echo "⚠️ This script must be run in Bash. Please run: bash setup.sh"
    exit 1
fi

DB_NAME="FakeDatabase"
DB_USER="root"
DB_PASSWORD="Kaushik07."
DB_HOST="localhost"
DB_PORT="3306"
APP_DIR="/opt/csye6225"
ZIP_FILE="SAI_KAUSHIK_BHIMA_002051114_02.zip"
CONFIG_FILE="${APP_DIR}/SAI_KAUSHIK_BHIMA_002051114_02/webapp-main/.env"
WEBAPP_FILE="${APP_DIR}/SAI_KAUSHIK_BHIMA_002051114_02/webapp-main/"
RUN_SCRIPT="${APP_DIR}/SAI_KAUSHIK_BHIMA_002051114_02/webapp-main/index.js"
NODE_SERVICE="node_app"


echo "Update system packages"
sudo apt update && sudo apt upgrade -y

echo "Install node dependencies"
sudo apt install -y mysql-server nodejs npm unzip curl ufw build-essential

echo "Starting MySQL"
sudo systemctl start mysql
sudo systemctl enable mysql

echo "Fixing MySQL authentication"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "Configuring MySQL database"
sudo mysql -u root -p${DB_PASSWORD} -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
sudo mysql -u root -p${DB_PASSWORD} -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
sudo mysql -u root -p${DB_PASSWORD} -e "FLUSH PRIVILEGES;"

echo "creating application direcgtory if not exisitng"
sudo mkdir -p ${APP_DIR}

echo "UNZIP FILE"
if [ -f "${ZIP_FILE}" ]; then
    sudo unzip -o ${ZIP_FILE} -d ${APP_DIR}
    sudo chown -R $(whoami):$(whoami) ${APP_DIR}  
    echo "Application extracted successfully."
else
    echo " ERROR: Zip file '${ZIP_FILE}' not found!"
    exit 1  
fi

echo "Creating .env file"
cat <<EOF | sudo tee ${CONFIG_FILE}
DB_HOST=${DB_HOST}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_PORT=${DB_PORT}
EOF
sudo chown $(whoami):$(whoami) ${CONFIG_FILE}

echo "Installing Node.js dependencies..."
cd ${WEBAPP_FILE}
if [ -f "package.json" ]; then
    npm install
    echo "installed packages"
else
    echo "error installing packages"
    exit 1
fi


echo "Configuring firewall..."
sudo ufw allow 8080/tcp
sudo ufw enable
sudo ufw reload

echo "⚙️ Creating systemd service for Node.js..."
sudo bash -c "cat > /etc/systemd/system/${NODE_SERVICE}.service <<EOF
[Unit]
Description=Node.js Application
After=network.target

[Service]
User=$(whoami)
Group=$(whoami)
WorkingDirectory=$(dirname ${CONFIG_FILE})
ExecStart=/usr/bin/node ${RUN_SCRIPT}
Restart=always
Environment=NODE_ENV=production
EnvironmentFile=${CONFIG_FILE}

[Install]
WantedBy=multi-user.target
EOF"

echo "Starting Node.js application using systemd..."
sudo systemctl daemon-reload
sudo systemctl start ${NODE_SERVICE}
sudo systemctl enable ${NODE_SERVICE}

echo "Deployment completed!"
echo "API is live at: http://$(curl -4 ifconfig.me):8080/healthz"
