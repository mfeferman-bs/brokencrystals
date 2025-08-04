pipeline {
    agent any

    environment {
        BRIGHT_API_TOKEN     = credentials('bright-api-token')
        BRIGHT_PROJECT_ID    = credentials('bright-project-id')
        BRIGHT_REPEATER_ID   = credentials('bright-repeater-id') // optional
        ARCHIVE_PATH         = 'swagger.json'
        TIMEOUT_SECONDS      = 600
    }

    stages {

        stage('Install Docker') {
            steps {
                script {
                    // Check if Docker is installed
                    def dockerInstalled = sh(script: 'which docker', returnStatus: true) == 0
                    if (!dockerInstalled) {
                        echo "Docker is not installed. Installing Docker..."

                        // Install Docker
                        sh 'curl -fsSL https://get.docker.com -o get-docker.sh'
                        sh 'sudo sh get-docker.sh'

                        // Start Docker service if it's not running
                        sh 'sudo systemctl start docker'

                        // Add Jenkins user to the Docker group to avoid sudo for docker commands
                        sh 'sudo usermod -aG docker jenkins'

                        echo "Docker installed successfully!"
                    } else {
                        echo "Docker is already installed."
                    }
                }
            }
        }
        
        stage('Upload OpenAPI Archive') {
            steps {
                script {
                    def archiveId = sh(script: """
                        docker run --rm -v "\$PWD:\$PWD" -w "\$PWD" brightsec/cli archive:upload \
                          --type openapi \
                          --token "$BRIGHT_API_TOKEN" \
                          --project-id "$BRIGHT_PROJECT_ID" \
                          "$ARCHIVE_PATH"
                    """, returnStdout: true).trim()

                    if (!archiveId) {
                        error "Archive upload failed"
                    }

                    env.FILE_ID = archiveId
                }
            }
        }

        stage('Run Discovery') {
            steps {
                script {
                    def discoveryCmd = """
                        docker run --rm brightsec/cli discovery:run \
                          --token "$BRIGHT_API_TOKEN" \
                          --project-id "$BRIGHT_PROJECT_ID" \
                          --type oas \
                          --file-id "$FILE_ID"
                    """
                    if (BRIGHT_REPEATER_ID?.trim()) {
                        discoveryCmd += " --repeater $BRIGHT_REPEATER_ID"
                    }

                    def output = sh(script: discoveryCmd, returnStdout: true).trim()
                    env.DISCOVERY_ID = sh(script: "echo '$output' | jq -r '.id'", returnStdout: true).trim()
                }
            }
        }

        stage('Wait for Discovery') {
            steps {
                script {
                    def status = ""
                    def timeout = TIMEOUT_SECONDS.toInteger()
                    def start = System.currentTimeMillis()

                    while (true) {
                        status = sh(script: """
                            docker run --rm brightsec/cli discovery:status \
                              --token "$BRIGHT_API_TOKEN" \
                              --project-id "$BRIGHT_PROJECT_ID" \
                              --id "$DISCOVERY_ID" | jq -r '.status'
                        """, returnStdout: true).trim()

                        if (status != "running" && status != "queued") {
                            break
                        }

                        if ((System.currentTimeMillis() - start) / 1000 > timeout) {
                            error("Discovery timed out")
                        }

                        sleep 10
                    }

                    if (status != "completed") {
                        error("Discovery failed with status: $status")
                    }
                }
            }
        }

        stage('Get Entrypoints') {
            steps {
                script {
                    sh 'docker run --rm brightsec/cli entrypoints:list --token "$BRIGHT_API_TOKEN" --project "$BRIGHT_PROJECT_ID" --limit 500 > entrypoints.json'
                    def ids = sh(script: "grep -o '\"id\": *\"[^\"]*\"' entrypoints.json | sed 's/.*: *\"//' | sed 's/\"\$//' | tr '\\n' ' '", returnStdout: true).trim()

                    if (!ids) {
                        error("No entrypoints found")
                    }

                    def eps = ids.split().collect { "-e ${it}" }.join(' ')
                    env.ENTRYPOINT_ARGS = eps
                }
            }
        }

        stage('Run Vulnerability Scan') {
            steps {
                script {
                    def scanName = "API Scan ${new Date().format("yyyy-MM-dd_HH-mm-ss")}"
                    def repeaterArg = BRIGHT_REPEATER_ID?.trim() ? "--repeater $BRIGHT_REPEATER_ID" : ""

                    def scanCmd = """
                        docker run --rm brightsec/cli scan:run \
                          --token "$BRIGHT_API_TOKEN" \
                          --project "$BRIGHT_PROJECT_ID" \
                          --bucket api \
                          --name "$scanName" \
                          $repeaterArg $ENTRYPOINT_ARGS
                    """
                    sh scanCmd
                }
            }
        }
    }
}
