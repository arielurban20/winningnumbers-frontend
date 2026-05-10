#!/bin/bash

# Logo Addition Helper Script
# Usage: ./scripts/add-logo.sh <state> <game-slug>
# Example: ./scripts/add-logo.sh ca powerball

if [ $# -lt 2 ]; then
    echo "Usage: $0 <state> <game-slug>"
    echo "Example: $0 ca powerball"
    echo ""
    echo "This script helps you:"
    echo "1. Create the logo file name"
    echo "2. Show you where to add it to GameLogo.tsx"
    exit 1
fi

STATE=$1
GAME=$2
FILENAME="${STATE}-${GAME}.svg"
KEY="\"${STATE}-${GAME}\": \"/logos/${FILENAME}.svg\","

echo "Logo Configuration Helper"
echo "========================"
echo ""
echo "1. Upload your SVG file to: public/logos/${FILENAME}"
echo ""
echo "2. Add this line to LOCAL_LOGOS in components/cards/GameLogo.tsx:"
echo ""
echo "  ${KEY}"
echo ""
echo "3. The GameLogo component will automatically use it!"
echo ""
echo "Done! The logo will load instantly from your local folder."
