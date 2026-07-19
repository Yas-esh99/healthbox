#!/usr/bin/env bash
# =============================================================================
#  Healthbox — Unified Startup Script
#  Usage:
#    ./start.sh          → Localhost mode (loopback only)
#    ./start.sh --lan    → LAN mode (exposed on network IP)
#
#  Prerequisites:
#    - Python 3.10+ with .venv created in backend/
#    - Bun or Node.js/npm installed
#    - backend/.env configured
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# --- Color codes ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# --- Parse arguments ---
LAN_MODE=false
if [[ "$1" == "--lan" ]]; then
  LAN_MODE=true
fi

# --- Banner ---
echo -e ""
echo -e "${BOLD}${CYAN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}  ║        Healthbox v3.0 Startup        ║${NC}"
echo -e "${BOLD}${CYAN}  ╚══════════════════════════════════════╝${NC}"
echo -e ""

if $LAN_MODE; then
  echo -e "${YELLOW}  🌐 Mode: LAN (Network-exposed)${NC}"
else
  echo -e "${BLUE}  🔒 Mode: Localhost (Loopback only)${NC}"
fi
echo -e ""

# --- Validate directories ---
if [[ ! -d "$BACKEND_DIR" ]]; then
  echo -e "${RED}  ✗ backend/ directory not found at $BACKEND_DIR${NC}"
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR" ]]; then
  echo -e "${RED}  ✗ frontend/ directory not found at $FRONTEND_DIR${NC}"
  exit 1
fi

# --- Find Python executable ---
PYTHON_BIN=""
if [[ -f "$BACKEND_DIR/.venv/bin/python" ]]; then
  PYTHON_BIN="$BACKEND_DIR/.venv/bin/python"
elif command -v python3 &>/dev/null; then
  PYTHON_BIN="python3"
elif command -v python &>/dev/null; then
  PYTHON_BIN="python"
else
  echo -e "${RED}  ✗ Python not found. Please install Python 3.10+ or create backend/.venv${NC}"
  exit 1
fi

UVICORN_BIN=""
if [[ -f "$BACKEND_DIR/.venv/bin/uvicorn" ]]; then
  UVICORN_BIN="$BACKEND_DIR/.venv/bin/uvicorn"
elif command -v uvicorn &>/dev/null; then
  UVICORN_BIN="uvicorn"
else
  echo -e "${RED}  ✗ uvicorn not found. Run: pip install -r backend/requirements.txt${NC}"
  exit 1
fi

# --- Find frontend package manager ---
PKG_MANAGER=""
if command -v bun &>/dev/null; then
  PKG_MANAGER="bun"
elif command -v npm &>/dev/null; then
  PKG_MANAGER="npm"
else
  echo -e "${RED}  ✗ Neither bun nor npm found. Please install one.${NC}"
  exit 1
fi

echo -e "  ${GREEN}✓${NC} Python:  $PYTHON_BIN"
echo -e "  ${GREEN}✓${NC} Uvicorn: $UVICORN_BIN"
echo -e "  ${GREEN}✓${NC} Frontend package manager: $PKG_MANAGER"
echo -e ""

# --- Check for .env file ---
if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  echo -e "${YELLOW}  ⚠ Warning: backend/.env not found. Copying from .env.example...${NC}"
  if [[ -f "$BACKEND_DIR/.env.example" ]]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo -e "${YELLOW}    Please edit backend/.env with your credentials before continuing.${NC}"
    exit 1
  else
    echo -e "${RED}  ✗ backend/.env.example also not found. Cannot proceed.${NC}"
    exit 1
  fi
fi

# --- Install frontend dependencies if node_modules is missing ---
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo -e "${YELLOW}  ⚙ Frontend node_modules not found. Installing...${NC}"
  cd "$FRONTEND_DIR"
  if [[ "$PKG_MANAGER" == "bun" ]]; then
    bun install
  else
    npm install
  fi
  echo -e ""
fi

# --- Determine host flags ---
BACKEND_HOST="127.0.0.1"
FRONTEND_HOST_FLAG=""

if $LAN_MODE; then
  BACKEND_HOST="0.0.0.0"
  FRONTEND_HOST_FLAG="-- --host"
  
  # Get the local network IP to display
  LAN_IP=""
  if command -v hostname &>/dev/null; then
    LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
  if [[ -z "$LAN_IP" ]] && command -v ip &>/dev/null; then
    LAN_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
  fi
fi

# --- PID tracking for cleanup ---
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo -e ""
  echo -e "${YELLOW}  ⏹ Shutting down servers...${NC}"

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Backend stopped (PID: $BACKEND_PID)"
  fi

  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Frontend stopped (PID: $FRONTEND_PID)"
  fi

  echo -e "${CYAN}  👋 Healthbox stopped. Goodbye!${NC}"
  echo -e ""
  exit 0
}

trap cleanup SIGINT SIGTERM

# --- Start Backend ---
echo -e "${BOLD}  🚀 Starting Backend (FastAPI + Uvicorn)...${NC}"
cd "$BACKEND_DIR"
"$UVICORN_BIN" app.main:app \
  --host "$BACKEND_HOST" \
  --port 8000 \
  --reload \
  2>&1 | sed 's/^/  [backend] /' &
BACKEND_PID=$!
echo -e "  ${GREEN}✓${NC} Backend started — PID: $BACKEND_PID"
echo -e ""

# Give backend a moment to start before frontend
sleep 2

# --- Start Frontend ---
echo -e "${BOLD}  🎨 Starting Frontend (Vite + TanStack Start)...${NC}"
cd "$FRONTEND_DIR"
if [[ "$PKG_MANAGER" == "bun" ]]; then
  bun run dev $FRONTEND_HOST_FLAG 2>&1 | sed 's/^/  [frontend] /' &
else
  npm run dev $FRONTEND_HOST_FLAG 2>&1 | sed 's/^/  [frontend] /' &
fi
FRONTEND_PID=$!
echo -e "  ${GREEN}✓${NC} Frontend started — PID: $FRONTEND_PID"
echo -e ""

# --- Print Access URLs ---
sleep 3
echo -e "${BOLD}${CYAN}  ═══════════════════════════════════════${NC}"
echo -e "${BOLD}  📡 Healthbox is running!${NC}"
echo -e "${BOLD}${CYAN}  ═══════════════════════════════════════${NC}"
echo -e ""
echo -e "  ${BOLD}Frontend:${NC}"
echo -e "    Local:   ${GREEN}http://localhost:5173${NC}"
if $LAN_MODE && [[ -n "$LAN_IP" ]]; then
  echo -e "    Network: ${GREEN}http://${LAN_IP}:5173${NC}"
fi
echo -e ""
echo -e "  ${BOLD}Backend API:${NC}"
echo -e "    Local:   ${GREEN}http://localhost:8000${NC}"
echo -e "    Docs:    ${GREEN}http://localhost:8000/docs${NC}"
if $LAN_MODE && [[ -n "$LAN_IP" ]]; then
  echo -e "    Network: ${GREEN}http://${LAN_IP}:8000${NC}"
fi
echo -e ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo -e ""

# --- Wait for both processes ---
wait $BACKEND_PID $FRONTEND_PID
