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
    }

    post {
        success {
            echo 'Pipeline completed successfully with Ansible!'
        }

        failure {
            echo 'Pipeline failed during Ansible deployment.'
        }
    }
}