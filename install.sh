#!/usr/bin/env bash
set -e

echo "=== Installing Forensic Due Diligence Engine ==="

INSTALL_DIR="/usr/share/forensic-dd-engine"
BIN_LINK="/usr/local/bin/forensic-dd"

# Check if running as root / sudo for system-wide install
if [ "$EUID" -ne 0 ]; then
    echo "[-] Please run with sudo for system-wide installation:"
    echo "    sudo ./install.sh"
    exit 1
fi

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[+] Copying engine files to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
cp -r "$SRC_DIR/api" "$SRC_DIR/debate" "$SRC_DIR/docs" "$SRC_DIR/eval" \
      "$SRC_DIR/graph" "$SRC_DIR/ingest" "$SRC_DIR/monitoring" \
      "$SRC_DIR/quant" "$SRC_DIR/report" "$SRC_DIR/retrieval" \
      "$SRC_DIR/tests" "$SRC_DIR/bin" "$SRC_DIR/requirements.txt" "$INSTALL_DIR/"

echo "[+] Installing python dependencies..."
pip install --no-cache-dir -r "$INSTALL_DIR/requirements.txt"

echo "[+] Creating global terminal command 'forensic-dd'..."
cat << 'EOF' > "$BIN_LINK"
#!/usr/bin/env python3
import sys
import os
import uvicorn

def main():
    sys.path.insert(0, '/usr/share/forensic-dd-engine')
    os.chdir('/usr/share/forensic-dd-engine')
    
    if len(sys.argv) > 1 and sys.argv[1] == "audit":
        ticker = sys.argv[2] if len(sys.argv) > 2 else "MSFT"
        from ingest.live_ingest import LiveEdgarIngester
        from quant.engine import run_quant_audit
        print(f"Fetching and auditing {ticker} via SEC EDGAR...")
        ingester = LiveEdgarIngester()
        quant_bundle, chunks, metadata, was_cached = ingester.ingest_and_audit_ticker(ticker)
        print("\n=== FORENSIC DUE DILIGENCE AUDIT REPORT ===")
        print(f"Ticker: {ticker} | Entity: {metadata.get('entity_name')}")
        print(f"Fiscal Year: {metadata.get('fiscal_year')} (Cached: {was_cached})")
        print(f"Beneish M-Score: {quant_bundle.beneish.m_score:.2f} (Suspect: {quant_bundle.beneish.is_manipulator_suspect})")
        print(f"Sloan Accrual Ratio: {quant_bundle.sloan.accrual_ratio * 100:.2f}% (Red Flag: {quant_bundle.sloan.is_red_flag})")
        print(f"Altman Z-Score: {quant_bundle.altman.z_score:.2f} [{quant_bundle.altman.zone}]")
        print(f"Total Red Flags: {quant_bundle.red_flag_count}")
        print("===========================================\n")
        return

    port = int(os.getenv("PORT", "8000"))
    print(f"Starting Forensic Due Diligence Server on http://0.0.0.0:{port}")
    print(f"Swagger API Docs: http://localhost:{port}/docs")
    uvicorn.run("api.server:app", host="0.0.0.0", port=port)

if __name__ == "__main__":
    main()
EOF
chmod +x "$BIN_LINK"

echo "[+] Installation complete! You can now run:"
echo "    forensic-dd            # Starts the FastAPI server"
echo "    forensic-dd audit NVDA # Runs an instant quantitative audit"
