# Simple HTTP Server in PowerShell
$port = 8000
$directory = Get-Location
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server running at http://localhost:$port/"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $path = $request.Url.AbsolutePath
    if ($path -eq "/") { $path = "/index.html" }
    
    $filePath = Join-Path $directory $path.TrimStart("/")

    # Handle autotest POST endpoint to collect results
    if ($request.HttpMethod -eq 'POST' -and $path -eq '/autotest') {
        try {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $body = $reader.ReadToEnd()
            $outPath = Join-Path $directory 'autotest-results.txt'
            Add-Content -Path $outPath -Value "===== AUTOTEST @ $(Get-Date) ====="
            Add-Content -Path $outPath -Value $body
            $response.StatusCode = 200
            $resp = [System.Text.Encoding]::UTF8.GetBytes("OK")
            $response.OutputStream.Write($resp, 0, $resp.Length)
        } catch {
            $response.StatusCode = 500
            $err = [System.Text.Encoding]::UTF8.GetBytes("ERROR")
            $response.OutputStream.Write($err, 0, $err.Length)
        }
    }
    elseif (Test-Path $filePath -PathType Leaf) {
        $fileContent = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $fileContent.Length
        $response.OutputStream.Write($fileContent, 0, $fileContent.Length)
    } else {
        $response.StatusCode = 404
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    
    $response.Close()
}
