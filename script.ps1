Add-Type -AssemblyName System.Windows.Forms

# Load Win32 positioning tools with GetForegroundWindow
if (-not ([System.Management.Automation.PSTypeName]"MultiSnapper").Type) {
    Add-Type -TypeDefinition @"
    using System;
    using System.Runtime.InteropServices;
    public class MultiSnapper {
        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
    }
"@
}

# 1. Screen calculations (Right sidebar layout)
$screen   = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$screenW  = $screen.Width
$screenH  = $screen.Height
$baseY    = $screen.Y

# ==================== MARGIN & LAYOUT CONFIGURATION ====================
$winWidth    = 716    # Width of the sidebar windows
$marginX     = 4      # Horizontal gap from the right edge of the screen
$marginY     = 12     # Vertical gap at the very top and very bottom of the screen
$gap         = 4      # Vertical spacing between the windows themselves

# Set fixed heights for the top and bottom panels relative to screen size
$topRatio    = 0.14   # ~14% screen height (Top / Green)
$bottomRatio = 0.20   # ~20% screen height (Bottom / Blue)

# COMPENSATION FOR CONSOLE GRID ROUNDING:
$middleHeightAdjustment = 6
# =======================================================================

# Calculate exact pixel heights
$hTop    = [math]::Floor($screenH * $topRatio)
$hBottom = [math]::Floor($screenH * $bottomRatio)

# Calculate Middle Height: Stretch to fill all remaining space + the rounding adjustment
$hMiddle = ($screenH - $hTop - $hBottom - ($marginY * 2) - ($gap * 2)) + $middleHeightAdjustment

# Coordinate calculations
$xPos    = $screenW - $winWidth - $marginX
$yTop    = $baseY + $marginY
$yMiddle = $yTop + $hTop + $gap
$yBottom = $yMiddle + $hMiddle + $gap

# Helper function to spawn a window, wait for focus, and snap it
function Spawn-And-Snap {
    param(
        [string]$Command,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height
    )

    # Spawn new powershell instance
    Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "$Command"

    # Wait 1 second for the new window to pop up and steal active focus
    Start-Sleep -Milliseconds 1000

    $hWnd = [MultiSnapper]::GetForegroundWindow()
    if ($hWnd -ne [IntPtr]::Zero) {
        [void][MultiSnapper]::MoveWindow($hWnd, $X, $Y, $Width, $Height, $true)
    } else {
        Write-Warning "Could not grab focus for the newly spawned window."
    }
}

# ==================== YOUR CUSTOM COMMANDS HERE ====================
# We jump straight into the login-server folder, output the header, and run your pnpm command
$topCommand    = "cd C:\Projects\DungeonShadows\login-server; pnpm --filter login-server dev"
$middleCommand = "cd C:\Projects\DungeonShadows\server; pnpm --filter dungeonshadows-server dev"
$bottomCommand = "cd C:\Projects\DungeonShadows\client; pnpm --filter dungeonshadows-client dev"
# ===================================================================

# 2. Launch and position the stack sequentially
# Write-Host "Snapping TOP window..." -ForegroundColor Green
Spawn-And-Snap -Command $topCommand -X $xPos -Y $yTop -Width $winWidth -Height $hTop

# Write-Host "Snapping MIDDLE window..." -ForegroundColor Red
Spawn-And-Snap -Command $middleCommand -X $xPos -Y $yMiddle -Width $winWidth -Height $hMiddle

# Write-Host "Snapping BOTTOM window..." -ForegroundColor Cyan
Spawn-And-Snap -Command $bottomCommand -X $xPos -Y $yBottom -Width $winWidth -Height $hBottom