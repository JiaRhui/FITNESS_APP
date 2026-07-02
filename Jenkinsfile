pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Code checked out from GitHub'
            }
        }
        
        stage('Deploy with Ansible') {
            steps {
                sh 'ansible-playbook -i ansible/hosts ansible/deploy_docker_playbook.yaml'
            }
        }

        stage('Clean Previous Container') {
            steps {
                sh 'docker-compose down || true'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker-compose build'
            }
        }

        stage('Run Application') {
            steps {
                sh 'docker-compose up -d'
            }
        }

        stage('Verify Container') {
            steps {
                sh '''
                    echo "===== Waiting for app to start ====="
                    sleep 10

                    echo "===== Docker Compose Status ====="
                    docker-compose ps

                    echo "===== App Logs ====="
                    docker-compose logs app
                '''
            }
        }

        stage('Health Check Inside App Container') {
            steps {
                sh '''
                    echo "===== Testing app from inside container ====="
                    docker exec fitness-app-pipeline-app-1 wget --spider -q http://0.0.0.0:3000/pages/login.html
                    echo "Health check passed"
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }

        failure {
            sh '''
                echo "===== Pipeline failed. Showing debug info ====="
                docker-compose ps || true
                docker-compose logs app || true
            '''
        }
    }
}