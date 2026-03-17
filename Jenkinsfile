pipeline {
    agent { label 'URS' }

    parameters {
        string(name: 'BRANCH_NAME', defaultValue: 'main')
        string(name: 'DEPLOY_SCRIPT_PATH', defaultValue: '/Pipeline_scripts/frontend_deploy.sh')
        string(name: 'PROJECT_URL', defaultValue: 'http://172.16.2.57/auth/login')
        string(
            name: 'EMAIL_RECIPIENT',
            defaultValue: 'rchandure@novatechset.com,skulkarni@novatechset.com,skhan@katalysttech.com,tgaygoye@katalysttech.com,spatel1@katalysttech.com,gsuryawanshi@novatechset.com,skokate@novatechset.com,skhade@katalysttech.com'
        )
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    stages {

        stage('Install Dependencies') {
            steps { sh 'npm ci'}
            post {
                failure {
                    script { currentBuild.description = env.STAGE_NAME }
                }
            }
        }

        stage('Packages Audit') {
            steps { sh 'npx --yes audit-ci --low' }
            post {
                failure { script { currentBuild.description = env.STAGE_NAME } }
                }
            }

        stage('Build Frontend') {
            steps { sh 'npm run build' }
            post {
                failure { script { currentBuild.description = env.STAGE_NAME } }
                }
            }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    def branch = env.BRANCH_NAME.replaceAll("/", "-")
                    def buildNumber = env.BUILD_NUMBER
                    def fullVersion = "${branch}-${buildNumber}"
                    withSonarQubeEnv('2.13_sonarqube') {
                        sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectVersion=${fullVersion}"
                    }
                    echo "SonarQube analysis completed with version: ${fullVersion}"
                }
            }
            post {
                failure { script { currentBuild.description = env.STAGE_NAME } }
            }
        }
            
        stage('Quality Gate') {
            steps {
                script {
                    def qg = waitForQualityGate abortPipeline: true
                    env.SONAR_STATUS = qg.status
                }
            }
            post {
                failure { script { currentBuild.description = env.STAGE_NAME } }
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh "bash ${params.DEPLOY_SCRIPT_PATH}"
            }
            post {
                failure { script { currentBuild.description = env.STAGE_NAME } }
            }
        }
    }

    post {
        always {
            script {

                def statusText  = currentBuild.currentResult
                def statusColor = (statusText == 'SUCCESS') ? 'green' :
                                  (statusText == 'FAILURE') ? 'red' : 'orange'

                def changeLog = ""

                for (changeSet in currentBuild.changeSets) {
                    for (entry in changeSet.items) {
                        changeLog += """
                        <b>Author:</b> ${entry.author}<br>
                        <b>Commit:</b> ${entry.commitId.take(7)}<br>
                        <b>Message:</b> ${entry.msg}<br>
                        """
                        changeLog += "<br><hr>"
                    }
                }

                if (changeLog == "") {
                    changeLog = "No SCM changes detected."
                }

                emailext(
                    to: params.EMAIL_RECIPIENT,
                    subject: "[${statusText}] ${env.JOB_NAME}",
                    mimeType: 'text/html',
                    attachLog: (statusText != 'SUCCESS'),
                    body: """
                    <html>
                    <body>
                        <h2>Pipeline Status</h2>
                        <table border='1' cellpadding='5' cellspacing='0'>
                            <tr><td><b>Job Name:</b></td><td>${env.JOB_NAME}</td></tr>
                            <tr><td><b>Build Number:</b></td><td>${env.BUILD_NUMBER}</td></tr>
                            <tr><td><b>Branch:</b></td><td>${params.BRANCH_NAME}</td></tr>
                            <tr>
                                <td><b>Changes:</b></td>
                                <td>${changeLog}</td>
                            </tr>

                            <tr>
                             <td><b>SonarQube Quality Gate:</b></td>
                             <td style="color:${env.SONAR_STATUS == 'OK' ? 'green' : 'red'};">
                             <b>${env.SONAR_STATUS ?: 'NOT RUN'}</b>
                             </td>
                            </tr>

                            <tr>
                            <td><b>Sonar Dashboard:</b></td>
                            <td>
                            <a href="http://172.16.2.13:9000/tutorials?id=URS-frontend">
                            Open Sonar Report
                            </a>
                            </td>
                            </tr>

                            ${statusText == 'FAILURE' ? """
                            <tr>
                                <td><b>Failed Stage:</b></td>
                                <td style='color:red;'>${currentBuild.description}</td>
                            </tr>
                            """ : ""}

                            <tr>
                                <td><b>Status:</b></td>
                                <td style='color:${statusColor}'>${statusText}</td>
                            </tr>

                            <tr>
                                <td><b>Project URL:</b></td>
                                <td><a href="${params.PROJECT_URL}">${params.PROJECT_URL}</a></td>
                            </tr>
                        </table>

                        <p>Regards,<br>DevOps Team</p>
                    </body>
                    </html>
                    """
                )
            }
            cleanWs()
        }
    }
}