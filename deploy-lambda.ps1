# deploy-lambda.ps1 - Sube el Lambda a AWS con un comando
# Uso: .\deploy-lambda.ps1

$AWS      = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
$FUNCTION = "alera-api"
$REGION   = "us-east-2"
$ZIP      = "$env:TEMP\alera-lambda.zip"

Write-Host "Comprimiendo index.mjs..." -ForegroundColor Cyan
Compress-Archive -Path "lambda\index.mjs" -DestinationPath $ZIP -Force

Write-Host "Subiendo a Lambda ($FUNCTION)..." -ForegroundColor Cyan
& $AWS lambda update-function-code `
  --function-name $FUNCTION `
  --zip-file "fileb://$ZIP" `
  --region $REGION `
  --output table

Write-Host "Deploy completado." -ForegroundColor Green
