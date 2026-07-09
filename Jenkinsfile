pipeline {
    agent any

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