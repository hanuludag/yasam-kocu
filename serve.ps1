# Minimal static file server for the Yasam Kocu app (no Node/Python required).
param([int]$Port = 3456)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Yasam Kocu serving at http://localhost:$Port/ (root: $root)"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".jsx"  = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $reqPath = $ctx.Request.Url.AbsolutePath
    if ($reqPath -eq "/") { $reqPath = "/index.html" }
    $file = Join-Path $root ($reqPath.TrimStart("/") -replace "/", "\")
    $full = [System.IO.Path]::GetFullPath($file)

    # Only serve files inside the app root (blocks path traversal).
    if ($full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path $full -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] }
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    else {
      $ctx.Response.StatusCode = 404
      $nf = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $ctx.Response.OutputStream.Write($nf, 0, $nf.Length)
    }
    $ctx.Response.OutputStream.Close()
  }
  catch {
    # Keep serving even if a single request fails (e.g. client disconnect).
  }
}
