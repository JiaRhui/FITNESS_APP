pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Code checked out from GitHub'
            }
        }

        stage('Clean Previous Container') {
            steps {
                sh '''
                    docker-compose down || true
                '''
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

        stage('Health Check') {
            steps {
                sh '''
                    echo "===== Health Check ====="
                    curl -f http://app:3000/pages/login.html
                '''
            }
        }
    }

    post {
        failure {
            sh '''
                docker-compose ps || true
                docker-compose logs app || true
            '''
        }
    }
}