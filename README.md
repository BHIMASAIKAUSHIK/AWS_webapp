# AWS_webapp

# Node.js Backend API with AWS Cloud Integration

A robust Node.js backend application with comprehensive AWS cloud integration, monitoring, and security features. This project demonstrates enterprise-level architecture with AWS services, automated testing, and infrastructure as code.

## 🚀 Features

- **File Management API** with upload, retrieve, and delete operations
- **AWS S3 Integration** for secure file storage with unique file keys
- **AWS RDS MySQL Database** with private subnet deployment
- **Auto Scaling Group** with load balancer for high availability
- **Application Load Balancer** with SSL/TLS certificate support
- **VPC with Public/Private Subnets** across multiple availability zones
- **CloudWatch Monitoring** with comprehensive logging and metrics
- **AWS Secrets Manager** for secure credential management
- **KMS Encryption** for EBS volumes, S3 buckets, RDS, and secrets
- **Route 53 DNS** with custom domain routing
- **IAM Roles & Policies** with least privilege access
- **Database Performance Monitoring** with operation timing metrics
- **Comprehensive Logging** with structured logging for all operations
- **Error Handling** with detailed error logging and stack traces
- **HTTP Method Validation** with proper 405 Method Not Allowed responses
- **Automated Testing** with Jest test suites
- **CI/CD Pipeline** using GitHub Actions
- **Infrastructure as Code** with Terraform

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL/Sequelize** - Database with ORM
- **Multer** - File upload middleware
- **UUID** - Unique identifier generation

### Cloud Services
#### AWS
- **VPC** - Virtual Private Cloud with public/private subnets
- **EC2** - Auto Scaling Group with Application Load Balancer
- **RDS** - Managed MySQL database in private subnets
- **S3** - Object storage for files with lifecycle policies
- **Route 53** - DNS management with custom domain
- **CloudWatch** - Monitoring, logging, and alarms
- **Secrets Manager** - Secure credential storage
- **KMS** - Key Management Service for encryption
- **IAM** - Identity and Access Management

### DevOps & Infrastructure
- **Terraform** - Infrastructure as Code
- **GitHub Actions** - CI/CD pipeline
- **Shell Scripts** - VM management and deployment
- **Jest** - Testing framework
- **SSL/TLS** - Certificate management

## 📋 Prerequisites

- Node.js (version X.X.X)
- npm or yarn
- AWS CLI configured
- Terraform installed
- MySQL client (optional, for local development)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database Configuration (Retrieved from AWS Secrets Manager)
DB_HOST=your-rds-endpoint
DB_USER=csye6225
DB_PASSWORD=auto-generated-secure-password
DB_NAME=csye6225
DB_PORT=3306
DB_DIALECT=mysql

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=auto-generated-uuid-bucket-name

# Application Configuration
PORT=3000
NODE_ENV=production
NODE_PATH=/opt/csye6225/webapp/node_modules

# Domain Configuration
DOMAIN=demo.bhimasaikaushik.com
```

### 4. Database Setup
```bash
# Run database migrations (if applicable)
npm run migrate

# Seed database (if applicable)
npm run seed
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Using Shell Scripts
```bash
# Start VM and run health checks
./scripts/start-vm.sh

# Run health check
./scripts/health-check.sh
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Suite
```bash
npm test -- --testPathPattern=api
```

## 🏗 Infrastructure Architecture

### Network Architecture
- **VPC** with public and private subnets across 3 availability zones
- **Internet Gateway** for public subnet internet access
- **NAT Gateway** for private subnet outbound internet access
- **Route Tables** for proper traffic routing

### Compute Architecture
- **Auto Scaling Group** (3-5 instances) in private subnets
- **Application Load Balancer** in public subnets
- **Launch Template** with encrypted EBS volumes
- **Health Checks** with automatic instance replacement

### Security Architecture
- **Security Groups** with least privilege access
- **KMS Keys** for encryption at rest (EBS, S3, RDS, Secrets)
- **AWS Secrets Manager** for database credentials
- **IAM Roles** with specific permissions for each service

### Monitoring Architecture
- **CloudWatch Logs** with application and system log groups
- **CloudWatch Metrics** with custom StatsD metrics
- **Auto Scaling Alarms** based on CPU utilization
- **Load Balancer Health Checks** for application availability

## 🏗 Infrastructure Deployment

### 1. Terraform Variables
Create a `terraform.tfvars` file:
```hcl
region = "us-east-1"
profile = "demo"
vpc_cidr = "10.0.0.0/16"
public_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnets = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
vpc_name = "csye6225"
app_port = 3000
custom_ami_id = "ami-xxxxxxxxxx"
```

### 2. Terraform Deployment
```bash
cd terraform/
terraform init
terraform plan
terraform apply
```

### 3. Infrastructure Components Created
- **VPC** with public/private subnets
- **Auto Scaling Group** with 3-5 instances
- **Application Load Balancer** with SSL certificate
- **RDS MySQL** database in private subnets
- **S3 Bucket** with lifecycle policies and encryption
- **CloudWatch** log groups and alarms
- **Route 53** DNS record for custom domain
- **KMS Keys** for encryption
- **Secrets Manager** for database credentials

### 4. GitHub Actions Workflow
The project includes automated deployment through GitHub Actions:
- **Automated Testing** on push/PR
- **Custom AMI Creation** from successful builds
- **Terraform Infrastructure** deployment
- **SSL Certificate** management
- **Auto Scaling** based on CPU metrics

## 📊 Monitoring & Logging

### API Metrics Tracked
- **Database Operation Time** - Time taken for each database operation
- **File Upload Metrics** - Upload success/failure rates and timing
- **Auto Scaling Metrics** - CPU utilization and scaling events
- **Load Balancer Metrics** - Request count and response times
- **Application Health** - Health check status and availability
- **Error Tracking** - Detailed error logging with stack traces
- **HTTP Method Validation** - Tracking of invalid method attempts

### Database Operations Monitored
- `create_file` - File metadata creation
- `find_file_by_id` - File metadata retrieval
- `delete_file` - File deletion operations

### Auto Scaling Configuration
- **Min Size**: 3 instances
- **Max Size**: 5 instances
- **Scale Up**: CPU > 11% for 1 minute
- **Scale Down**: CPU < 9% for 1 minute
- **Health Check**: ELB-based with 900s grace period

### Log Storage & Monitoring
- **CloudWatch Logs** - Application and system logs with 30-day retention
- **S3 Bucket** - File storage with 30-day lifecycle to Standard-IA
- **Structured Logging** - JSON formatted logs with operation context
- **Real-time Monitoring** - CloudWatch agent with StatsD metrics

## 🔒 Security Features

### Encryption at Rest
- **EBS Volumes** - All EC2 instance volumes encrypted with KMS
- **S3 Bucket** - Server-side encryption with customer-managed KMS keys
- **RDS Database** - Storage encryption with dedicated KMS key
- **Secrets Manager** - Database credentials encrypted with KMS

### Network Security
- **VPC Security Groups** with least privilege access:
  - Load Balancer: HTTP (80) and HTTPS (443) from internet
  - Application: Traffic only from load balancer on port 3000
  - Database: MySQL (3306) only from application instances
  - SSH: Port 22 only from within VPC CIDR

### SSL/TLS Configuration
- **HTTPS Certificate** for custom domain
- **SSL Policy** ELBSecurityPolicy-2016-08
- **HTTP to HTTPS** redirection available
- **Custom Domain** routing via Route 53

### Access Management
- **IAM Instance Profile** with specific permissions:
  - S3 bucket read/write access
  - CloudWatch logs and metrics
  - Secrets Manager access for database credentials
  - Auto Scaling group interactions
