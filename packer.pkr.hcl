packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}


variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami" {
  type    = string
  default = "ami-0a25f237e97fa2b5e"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

variable "db_name" {
  type    = string
  default = "mydatabase"
}

variable "db_username" {
  type    = string
  default = "admin"
}

variable "db_password" {
  type    = string
  default = "password"
}

variable "db_user" {
  type    = string
  default = "root"
}


source "amazon-ebs" "ubuntu" {
  region        = var.aws_region
  profile       = "dev"
  source_ami    = var.source_ami
  instance_type = var.instance_type
  ssh_username  = "ubuntu"
  ami_name      = "csye6225-nodejs-app-${formatdate("YYYY-MM-DD-hh-mm-ss", timestamp())}"
  tags = {
    Name = "csye6225-nodejs-app"
  }
}

build {
  sources = ["source.amazon-ebs.ubuntu"]

  # Update system packages
  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get upgrade -y"
    ]
  }

  # Install dependencies
  provisioner "shell" {
    inline = [
      "export DEBIAN_FRONTEND=noninteractive",
      "sudo apt-get install -y ca-certificates curl gnupg",
      "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -",
      "sudo apt-get install -y nodejs",
      "sudo apt-get install -y mysql-server"
    ]
  }

  # Install CloudWatch Agent
  provisioner "shell" {
    inline = [
      "sudo apt-get install -y wget",
      "wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i amazon-cloudwatch-agent.deb",
      "sudo systemctl enable amazon-cloudwatch-agent.service",
      "rm -f amazon-cloudwatch-agent.deb"
    ]
  }

  # Configure MySQL (create new user and grant privileges)
  provisioner "shell" {
    inline = [
      # Start and enable MySQL service
      "sudo systemctl enable mysql",
      "sudo systemctl start mysql",

      # Ensure the MySQL root user can authenticate using a password
      "sudo mysql -u root -p${var.db_password} -e \"ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${var.db_password}';\"",

      # Flush privileges to apply changes
      "sudo mysql -u root -p${var.db_password} -e \"FLUSH PRIVILEGES;\"",

      # Create the database if it doesn't exist
      "sudo mysql -u root -p${var.db_password} -e \"CREATE DATABASE IF NOT EXISTS ${var.db_name};\"",

      # Grant privileges to the new user
      "sudo mysql -u root -p${var.db_password} -e \"GRANT ALL PRIVILEGES ON ${var.db_name}.* TO '${var.db_user}'@'localhost';\"",

      # Flush privileges again to apply changes
      "sudo mysql -u root -p${var.db_password} -e \"FLUSH PRIVILEGES;\""
    ]
  }

  # Create application directory
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/csye6225"
    ]
  }

  # Upload and unzip application
  provisioner "file" {
    source      = "../webapp" # Replace with your zip file name
    destination = "/tmp/webapp"
  }

  provisioner "shell" {
    inline = [
      "sudo mv /tmp/webapp /opt/csye6225/",
      "sudo chown -R $(whoami):$(whoami) /opt/csye6225"
    ]
  }

  # Install Node.js dependencies
  provisioner "shell" {
    inline = [
      "cd /opt/csye6225/webapp",
      "npm install",
      "npm install --save-dev jest",
      "npm install winston node-statsd --save", # Add logging and metrics libraries
      "chmod +x node_modules/.bin/jest"
    ]
  }

  provisioner "shell" {
    inline = [
      "cd /opt/csye6225/webapp",
      "npx jest test/test.js"
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo useradd -r -m csye6225",
      "sudo chown -R csye6225:csye6225 /opt/csye6225"
    ]
  }

  # Create logs directory
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/csye6225/webapp/logs",
      "sudo touch /opt/csye6225/webapp/logs/app.log",
      "sudo chmod 664 /opt/csye6225/webapp/logs/app.log",
      "sudo chown -R csye6225:csye6225 /opt/csye6225/webapp/logs"
    ]
  }

  # Create systemd service
  provisioner "file" {
    source      = "webapp.service" # Replace with your systemd service file
    destination = "/tmp/webapp.service"
  }

  provisioner "shell" {
    inline = [
      "sudo mv /tmp/webapp.service /etc/systemd/system/",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable webapp.service",
      "sudo systemctl start webapp.service"
    ]
  }

  # Clean up
  provisioner "shell" {
    inline = [
      "sudo apt-get clean",
      "sudo rm -rf /var/lib/apt/lists/*"
    ]
  }
}