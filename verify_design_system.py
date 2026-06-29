import sys
import os

GLOBALS_CSS_PATH = "patient-portal/src/app/globals.css"
LAYOUT_TSX_PATH = "patient-portal/src/app/layout.tsx"

def run_design_system_checks():
    print("============================================================")
    print("[UI/UX DESIGN SYSTEM & THEME TOOGLE SPEC CHECK START]")
    
    # 1. Check globals.css variable definitions
    print("[*] Scenario 1: Checking globals.css definitions...")
    if not os.path.exists(GLOBALS_CSS_PATH):
        print(f"[FAIL] globals.css not found at {GLOBALS_CSS_PATH}")
        sys.exit(1)
        
    with open(GLOBALS_CSS_PATH, "r") as f:
        content = f.read()
        
    # Check that variables exist
    variables = [
        "--background",
        "--foreground",
        "--card-bg",
        "--card-border",
        "--input-bg",
        "--input-border"
    ]
    
    for var in variables:
        assert var in content, f"Missing CSS theme token variable: {var}"
    
    # Check theme definitions
    assert ":root" in content or ".light" in content, "Missing default light theme variables"
    assert ".dark" in content, "Missing dark theme variables block"
    print("[PASS] Theme CSS token variables successfully configured.")

    # 2. Check font stacks in layout.tsx
    print("[*] Scenario 2: Verifying Google Fonts configuration...")
    if not os.path.exists(LAYOUT_TSX_PATH):
        print(f"[FAIL] layout.tsx not found at {LAYOUT_TSX_PATH}")
        sys.exit(1)
        
    with open(LAYOUT_TSX_PATH, "r") as f:
        layout = f.read()
        
    assert "Outfit" in layout, "Outfit display font not imported in Next.js layout"
    assert "Inter" in layout, "Inter copy font not imported in Next.js layout"
    assert "suppressHydrationWarning" in layout, "Missing suppressHydrationWarning to prevent SSR mismatch"
    print("[PASS] Outfit and Inter fonts loaded and wrapped correctly.")

    print("\n============================================================")
    print("[ALL UI/UX DESIGN SYSTEM CONFIGURATION CHECKS PASSED]")
    print("============================================================\n")

if __name__ == "__main__":
    run_design_system_checks()
