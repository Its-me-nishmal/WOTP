npm install 2>&1 | Out-File -FilePath install_log.txt -Encoding utf8
npm --version 2>&1 | Out-File -FilePath npm_version.txt -Encoding utf8
Get-Command npm 2>&1 | Out-File -FilePath command_path.txt -Encoding utf8
