# Smoke test local MVP (PowerShell)
$Api = if ($env:API_URL) { $env:API_URL } else { "http://localhost:8000" }
$Web = if ($env:WEB_URL) { $env:WEB_URL } else { "http://localhost:3000" }

Write-Host "==> API $Api"
try {
  $null = Invoke-WebRequest -Uri "$Api/api/categories" -UseBasicParsing
  Write-Host "  OK /api/categories"
  $null = Invoke-WebRequest -Uri "$Api/api/products" -UseBasicParsing
  Write-Host "  OK /api/products"
} catch {
  Write-Host "  ECHEC API: $_" -ForegroundColor Red
  exit 1
}

Write-Host "==> Site $Web"
$paths = @("/", "/produits", "/realisations", "/a-propos", "/devis", "/contact", "/robots.txt", "/sitemap.xml")
foreach ($p in $paths) {
  try {
    $r = Invoke-WebRequest -Uri "$Web$p" -UseBasicParsing
    Write-Host ("  {0}  {1}" -f $r.StatusCode, $p)
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host ("  {0}  {1}" -f $code, $p) -ForegroundColor Yellow
  }
}

Write-Host "Smoke test termine."
