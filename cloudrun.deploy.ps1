param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [string]$ServiceName = "ecotracker-city-care",
  [string]$Region = "europe-west8"
)

$ErrorActionPreference = "Stop"

if (-not $env:GEMINI_API_KEY) {
  throw "Set GEMINI_API_KEY in this shell before deploying."
}

gcloud config set project $ProjectId
gcloud run deploy $ServiceName `
  --source . `
  --region $Region `
  --allow-unauthenticated `
  --set-env-vars "GEMINI_API_KEY=$env:GEMINI_API_KEY,NODE_ENV=production"
