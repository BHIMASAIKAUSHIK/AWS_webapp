packer {
  required_plugins {
    googlecompute = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/googlecompute"
    }
  }
}

variable "gcp_project_id" {
  type    = string
  default = "dev-project-452106"
}

variable "gcp_zone" {
  type    = string
  default = "us-east1-b"
}

variable "source_image_family" {
  type    = string
  default = "ubuntu-2004-lts"
}

variable "machine_type" {
  type    = string
  default = "e2-micro"
}

variable "db_password" {
  type    = string
  default = "Kaushik07."
}

variable "db_username" {
  type    = string
  default = "csye_user"
}

variable "db_user" {
  type    = string
  default = "root"
}

variable "db_name" {
  type    = string
  default = "FakeDatabase"
}

source "googlecompute" "ubuntu" {
  project_id          = var.gcp_project_id
  zone                = var.gcp_zone
  source_image_family = var.source_image_family
  machine_type        = var.machine_type
  ssh_username        = "ubuntu"
  image_name          = "csye6225-nodejs-app-${formatdate("YYYY-MM-DD-hh-mm-ss", timestamp())}"
  image_description   = "CSYE6225 Node.js App Image"
  tags                = ["csye6225-nodejs-app"]
}

build {
  sources = ["source.googlecompute.ubuntu"]

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