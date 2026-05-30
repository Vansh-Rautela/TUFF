$body = @{
  userData = @{ gender = "Men"; bodyType = "Athletic"; brands = @("Amazon","Myntra") }
  filters = @{ brands = @("Amazon","Myntra") }
  prompt = "casual t-shirts"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:5000/scrape_products" -Method Post -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 6