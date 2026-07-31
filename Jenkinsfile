pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = '25003399'

        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/fitness-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/fitness-frontend"

        LOCAL_BACKEND_IMAGE = 'fitness-app-production-backend'
        LOCAL_FRONTEND_IMAGE = 'fitness-app-production-frontend'
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

        stage('Security Scan (Trivy)') {
            // Scans the freshly built images for known HIGH/CRITICAL
            // vulnerabilities BEFORE they are pushed to Docker Hub. Runs Trivy
            // as a container so nothing needs installing on the Jenkins agent;
            // the vulnerability DB is cached in the workspace for speed.
            //
            // --exit-code 0 => report only, never fail the build. Base images
            // always carry some unfixable CVEs. --ignore-unfixed hides vulns
            // with no available fix, so the report shows only actionable items.
            // To turn this into a real gate later, change --exit-code 0 to 1.
            steps {
                sh '''
                    mkdir -p trivy-reports .trivy-cache

                    for target in "${LOCAL_BACKEND_IMAGE}:latest" "${LOCAL_FRONTEND_IMAGE}:latest"; do
                        safe_name=$(echo "${target}" | tr '/:' '__')
                        echo "=== Scanning ${target} ==="

                        docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v "${WORKSPACE}/.trivy-cache:/root/.cache/trivy" \
                            -v "${WORKSPACE}/trivy-reports:/reports" \
                            aquasec/trivy:latest image \
                            --scanners vuln \
                            --severity HIGH,CRITICAL \
                            --ignore-unfixed \
                            --exit-code 0 \
                            --no-progress \
                            --format table \
                            --output "/reports/${safe_name}.txt" \
                            "${target}"

                        docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v "${WORKSPACE}/.trivy-cache:/root/.cache/trivy" \
                            aquasec/trivy:latest image \
                            --scanners vuln \
                            --severity HIGH,CRITICAL \
                            --ignore-unfixed \
                            --exit-code 0 \
                            --no-progress \
                            "${target}"
                    done
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-reports/*.txt', allowEmptyArchive: true
                }
            }
        }

        stage('Tag Docker Images') {
            steps {
                sh '''
                    docker tag ${LOCAL_BACKEND_IMAGE}:latest \
                    ${BACKEND_IMAGE}:${BUILD_NUMBER}

                    docker tag ${LOCAL_BACKEND_IMAGE}:latest \
                    ${BACKEND_IMAGE}:latest

                    docker tag ${LOCAL_FRONTEND_IMAGE}:latest \
                    ${FRONTEND_IMAGE}:${BUILD_NUMBER}

                    docker tag ${LOCAL_FRONTEND_IMAGE}:latest \
                    ${FRONTEND_IMAGE}:latest
                '''
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "${DOCKER_PASS}" |
                        docker login \
                        -u "${DOCKER_USER}" \
                        --password-stdin

                        docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${BACKEND_IMAGE}:latest

                        docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${FRONTEND_IMAGE}:latest
                    '''
                }
            }
        }

        stage('Deploy with Ansible') {
            steps {
                sh '''
                    ansible-playbook \
                    -i ansible/hosts \
                    ansible/deploy_docker_playbook.yaml
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    curl \
                    --fail \
                    --retry 5 \
                    --retry-delay 5 \
                    http://host.docker.internal:3001/health
                '''

                sh '''
                    curl \
                    --fail \
                    --retry 5 \
                    --retry-delay 5 \
                    http://host.docker.internal:3000/pages/login.html
                '''
            }
        }
    }

    post {
        success {
            echo 'Fitness App production CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'Fitness App production CI/CD pipeline failed.'
        }

        always {
            sh 'docker logout || true'
        }
    }
}
