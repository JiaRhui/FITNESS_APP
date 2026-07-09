pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = '25003399'
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/fitness-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/fitness-frontend"
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Tag Docker Images') {
            steps {
                sh 'docker tag fitness-app-pipeline-backend:latest $BACKEND_IMAGE:latest'
                sh 'docker tag fitness-app-pipeline-frontend:latest $FRONTEND_IMAGE:latest'
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh 'docker push $BACKEND_IMAGE:latest'
                    sh 'docker push $FRONTEND_IMAGE:latest'
                }
            }
        }

        stage('Deploy with Ansible') {
            steps {
                sh 'ansible-playbook -i ansible/hosts ansible/deploy_docker_playbook.yaml'
            }
        }

        stage('Verify Deployment') {
            steps {
                sh 'curl -f http://fitness-backend:3000/health'
                sh 'curl -f http://fitness-frontend:80/pages/login.html'
            }
        }
    }

    post {
        success {
            echo 'Fitness App CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'Fitness App CI/CD pipeline failed.'
        }
    }
}