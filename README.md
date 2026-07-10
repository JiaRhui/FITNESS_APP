# RP Fitness App

> Republic Polytechnic C270 DevOps Essentials Project

## Overview

RP Fitness App is a web application built with **Node.js**,
**HTML/CSS/JavaScript**, **Docker**, **Docker Compose**, **Jenkins**,
**Ansible**, and **GitHub** to demonstrate an end-to-end CI/CD pipeline
with separate **Staging** and **Production** environments.

## Technologies

-   Node.js
-   HTML / CSS / JavaScript
-   Nginx
-   Docker
-   Docker Compose
-   Jenkins
-   Ansible
-   GitHub

------------------------------------------------------------------------

# System Architecture

``` text
Browser
   │
   ▼
Frontend (Nginx)
   │ REST API
   ▼
Backend (Node.js)
```

------------------------------------------------------------------------

# DevOps Workflow

``` text
feature/*
      │
      ▼
Pull Request
      │
      ▼
staging
      │
      ▼
Fitness-App-Staging
      │
      ▼
Docker Compose (Staging)
      │
      ▼
Ansible Deployment
      │
      ▼
Testing
      │
      ▼
Merge staging → main
      │
      ▼
Fitness-App-Production
      │
      ▼
Docker Compose (Production)
      │
      ▼
Production Environment
```

------------------------------------------------------------------------

# Branch Strategy

-   **main** -- Production
-   **staging** -- Integration/Staging
-   **feature/**\* -- Individual feature development

All development is performed on feature branches, merged into
**staging**, tested automatically, and only then promoted to **main**.

------------------------------------------------------------------------

# Jenkins Pipelines

## Fitness-App-Staging

-   Branch: `staging`
-   Pipeline: `Jenkinsfile.staging`

Stages:

1.  Checkout Source Code
2.  Build Docker Images
3.  Deploy with Ansible
4.  Verify Backend
5.  Verify Frontend

## Fitness-App-Production

-   Branch: `main`
-   Pipeline: `Jenkinsfile`

Stages:

1.  Checkout Source Code
2.  Build Docker Images
3.  Tag Docker Images
4.  Push Images to Docker Hub
5.  Deploy with Ansible
6.  Verify Backend Health
7.  Verify Frontend

------------------------------------------------------------------------

# Docker

## Production

Compose:

`docker-compose.yml`

Ports

  Service    Host
  ---------- ------
  Frontend   3000
  Backend    3001

## Staging

Compose:

`docker-compose.staging.yml`

Ports

  Service    Host
  ---------- ------
  Frontend   4000
  Backend    4001

------------------------------------------------------------------------

# Ansible

## Production

`ansible/deploy_docker_playbook.yaml`

Functions:

-   Stop existing containers
-   Build/start Docker Compose
-   Wait for startup
-   Backend health verification
-   Frontend verification

## Staging

`ansible/deploy_staging_playbook.yaml`

Same deployment workflow for staging environment.

------------------------------------------------------------------------

# Repository Structure

``` text
FITNESS_APP
├── backend/
├── frontend/
├── ansible/
├── docker-compose.yml
├── docker-compose.staging.yml
├── Jenkinsfile
├── Jenkinsfile.staging
└── README.md
```

------------------------------------------------------------------------

# Running Locally

``` bash
docker compose up -d --build
```

Stop:

``` bash
docker compose down
```

------------------------------------------------------------------------

# Running Staging

``` bash
docker compose -f docker-compose.staging.yml up -d --build
```

------------------------------------------------------------------------

# Deploy Using Ansible

Production

``` bash
ansible-playbook -i ansible/hosts ansible/deploy_docker_playbook.yaml
```

Staging

``` bash
ansible-playbook -i ansible/hosts ansible/deploy_staging_playbook.yaml
```

------------------------------------------------------------------------

# Health Checks

## Production

Frontend

`http://localhost:3000/pages/login.html`

Backend

`http://localhost:3001/health`

## Staging

Frontend

`http://localhost:4000/pages/login.html`

Backend

`http://localhost:4001/health`

------------------------------------------------------------------------

# Features

-   User Authentication
-   Workout Tracker
-   Nutrition Tracker
-   Daily Checklist
-   Gym Locator
-   Dashboard
-   Admin Management

------------------------------------------------------------------------

# CI/CD Summary

1.  Developer pushes code to a feature branch.
2.  Pull Request is created into `staging`.
3.  Jenkins Staging pipeline automatically builds and deploys.
4.  Team validates the staging environment.
5.  Staging is merged into `main`.
6.  Jenkins Production pipeline automatically builds, tags, pushes
    Docker images, deploys with Ansible, and performs health
    verification.

------------------------------------------------------------------------

# C270 Requirement Mapping

  Requirement              Status
  ------------------------ --------
  GitHub                   ✅
  Branching                ✅
  Pull Requests            ✅
  Docker                   ✅
  Docker Compose           ✅
  Jenkins                  ✅
  CI/CD                    ✅
  Ansible                  ✅
  Automatic Deployment     ✅
  Staging Environment      ✅
  Production Environment   ✅
  Health Verification      ✅

Optional security tools (SonarQube, Trivy, Hadolint, Bandit, OWASP) were
intentionally excluded from this implementation.

------------------------------------------------------------------------

# Lessons Learned

-   Implemented a complete Git branching workflow.
-   Automated deployments using Jenkins and Ansible.
-   Separated staging and production environments.
-   Used Docker Compose to ensure consistent deployments.
-   Implemented automated health verification after deployment.
-   Learned to troubleshoot container networking and CI/CD pipelines.

------------------------------------------------------------------------

# Future Improvements

-   SonarQube integration
-   Trivy image scanning
-   OWASP Dependency Check
-   Kubernetes deployment
-   Cloud deployment (AWS/Azure)

------------------------------------------------------------------------

# Team

Republic Polytechnic

C270 DevOps Essentials

RP Fitness App Project