pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy with Ansible') {
            steps {
                sh 'ansible-playbook -i ansible/hosts ansible/deploy_docker_playbook.yaml'
            }
        }

        stage('Verify Deployment') {
            steps {
                sh 'curl http://host.docker.internal:3001/health'
                sh 'curl http://host.docker.internal:3000/pages/login.html'
                sh 'docker ps'
            }
        }

    }
}