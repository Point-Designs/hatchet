#!/usr/bin/env bash
set -e

echo -e "\033[0;36m==========================================\033[0m"
echo -e "\033[0;36m   Hatchet transpiler CLI installer      \033[0m"
echo -e "\033[0;36m==========================================\033[0m"

if ! command -v npm &> /dev/null; then
    echo -e "\033[0;31mError: Node.js and npm are required to build Hatchet.\033[0m"
    exit 1
fi

echo -e "\n\033[0;33m[1/3] Installing dependencies and building...\033[0m"
npm install
npm run build

INSTALL_DIR="$HOME/.hatchet/bin"
mkdir -p "$INSTALL_DIR"

echo -e "\033[0;33m[2/3] Copying executable files to $INSTALL_DIR...\033[0m"
cp -r dist/* "$INSTALL_DIR/"

LAUNCHER="$INSTALL_DIR/hatchet"
cat << 'EOF' > "$LAUNCHER"
#!/usr/bin/env bash
node "$HOME/.hatchet/bin/index.js" "$@"
EOF

chmod +x "$LAUNCHER"

echo -e "\033[0;33m[3/3] Updating Shell PATH...\033[0m"
SHELL_PROFILE=""

if [ -f "$HOME/.bashrc" ]; then
    SHELL_PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.zshrc" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
fi

EXPORT_CMD='export PATH="$HOME/.hatchet/bin:$PATH"'

if [ -n "$SHELL_PROFILE" ]; then
    if ! grep -q "$INSTALL_DIR" "$SHELL_PROFILE"; then
        echo "" >> "$SHELL_PROFILE"
        echo "# Hatchet Transpiler CLI" >> "$SHELL_PROFILE"
        echo "$EXPORT_CMD" >> "$SHELL_PROFILE"
        echo -e "\033[0;32mAdded Hatchet to $SHELL_PROFILE\033[0m"
    else
        echo -e "\033[0;37mHatchet PATH already exists in $SHELL_PROFILE\033[0m"
    fi
fi

echo -e "\n\033[0;32m==========================================\033[0m"
echo -e "\033[0;32m   Good, Hatchet is installed.         \033[0m"
echo -e "\033[0;32m==========================================\033[0m"
echo -e "Run \033[1msource $SHELL_PROFILE\033[0m or restart your terminal."
echo -e "Then type: \033[1mhatchet --help\033[0m"