# 在当前 PowerShell 终端里临时启用项目自带的 Node 22 + pnpm 9。
# 不会修改系统默认的 Node 26，也不影响已安装的全局包。
#
# 用法：
#   . .\use-node22.ps1
#   node -v      # v22.x
#   pnpm -v      # 9.x
#   pnpm dev     # 启动开发服务器

$toolsDir = Join-Path (Split-Path -Parent $PSScriptRoot) ".tools"

$env:Path = "$toolsDir\node22;$toolsDir;$env:Path"
$env:npm_config_cache = Join-Path $toolsDir "npm-cache"

Write-Host "Node: $(& node -v)  pnpm: $(& pnpm -v)" -ForegroundColor Green
