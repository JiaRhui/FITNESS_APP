# 🏋️ RP Fitness App

A web-based fitness management application developed for Republic Polytechnic's DevOps Essentials module.

This project demonstrates a complete DevOps workflow using Docker, Docker Compose, Ansible, and Jenkins to automate deployment of a two-tier web application.

---

# 📖 Table of Contents

- Overview
- Project Architecture
- Technologies Used
- Project Structure
- Running the Application
- Docker Deployment
- Ansible Deployment
- Jenkins CI/CD
- Health Checks
- Troubleshooting

---

# 📌 Overview

The RP Fitness App allows users to:

- User Login & Registration
- Workout Tracking
- Nutrition Tracking
- Daily Checklist
- Gym Facilities
- Admin Dashboard
- User Management

The application is separated into two services:

- **Frontend** (Nginx)
- **Backend** (Node.js / Express)

This follows a modern two-tier architecture.

---

# 🏗 Project Architecture

```
                 GitHub
                    │
             Push to main
                    │
                    ▼
                Jenkins
                    │
          Runs Ansible Playbook
                    │
                    ▼
            Docker Compose
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
 Frontend Container      Backend Container
     (Nginx)             (Node / Express)
   Port 3000             Port 3001
```

---

# 💻 Technologies Used

## Frontend

- HTML
- CSS
- JavaScript
- Nginx

## Backend

- Node.js
- Express.js
- Express Session

## DevOps

- Docker
- Docker Compose
- Ansible
- Jenkins

---

# 📂 Project Structure

```
FITNESS_APP
│
├── backend
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── data
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── frontend
│   ├── assets
│   ├── pages
│   ├── src
│   ├── styles
│   ├── Dockerfile
│   └── nginx.conf
│
├── ansible
│   ├── ansible.cfg
│   ├── hosts
│   ├── deploy_docker_playbook.yaml
│   └── test_connection_playbook.yaml
│
├── docker-compose.yml
├── Dockerfile.jenkins
├── Jenkinsfile
└── README.md
```

---

# 🚀 Running the Application

## Prerequisites

- Docker Desktop
- Docker Compose
- Git

---

## Clone Repository

```bash
git clone <repository-url>
cd FITNESS_APP
```

---

## Start the Application

```bash
docker compose up -d --build
```

Docker Compose automatically:

- Builds backend image
- Builds frontend image
- Creates Docker network
- Starts backend container
- Starts frontend container

---

## Stop the Application

```bash
docker compose down
```

---

# 🌐 Access the Application

## Frontend

```
http://localhost:3000/pages/login.html
```

## Backend Health Check

```
http://localhost:3001/health
```

---

# 🐳 Docker Architecture

The project is split into two containers.

## Frontend Container

- Nginx
- Serves HTML
- Serves CSS
- Serves JavaScript

Port:

```
3000
```

---

## Backend Container

- Express.js
- REST API
- Authentication
- Workout APIs
- Nutrition APIs

Port:

```
3001
```

---

# 🤖 Deploy using Ansible

Run:

```bash
ansible-playbook -i ansible/hosts ansible/deploy_docker_playbook.yaml
```

The playbook will:

1. Stop existing containers
2. Build Docker images
3. Start Docker Compose
4. Verify backend health
5. Verify frontend accessibility

---

# 🔄 Jenkins Pipeline

The Jenkins pipeline automates deployment whenever code is pushed to the main branch.

Pipeline stages:

```
Checkout Source Code

↓

Deploy with Ansible

↓

Verify Backend

↓

Verify Frontend

↓

Deployment Complete
```

---

# ❤️ Health Checks

Backend:

```
GET /health
```

Returns:

```json
{
  "status": "OK",
  "service": "fitness-backend"
}
```

---

# 🔧 Useful Commands

Start containers

```bash
docker compose up -d --build
```

Stop containers

```bash
docker compose down
```

View running containers

```bash
docker ps
```

View logs

```bash
docker logs fitness-backend
docker logs fitness-frontend
```

Run Ansible

```bash
ansible-playbook -i ansible/hosts ansible/deploy_docker_playbook.yaml
```

---

# 👥 Contributors

- Jia Rhui
- Team Members

---

# 📄 License

Republic Polytechnic DevOps Essentials Project.