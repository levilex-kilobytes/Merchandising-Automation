#!/usr/bin/env bash
set -e

cd ~/capstone-projects/merchandising-funnel-automation

echo "🐳 Starting Docker..."
docker-compose -f infrastructure/docker/docker-compose.yml up -d
sleep 5

echo "🚀 Opening 8 terminals..."
gnome-terminal \
  --tab --title="vendor"                -- bash -c "cd $(pwd) && npm run dev:vendor; exec bash" \
  --tab --title="procurement"           -- bash -c "cd $(pwd) && npm run dev:procurement; exec bash" \
  --tab --title="receiving"             -- bash -c "cd $(pwd) && npm run dev:receiving; exec bash" \
  --tab --title="inventory"             -- bash -c "cd $(pwd) && npm run dev:inventory; exec bash" \
  --tab --title="vendor-portal"         -- bash -c "cd $(pwd) && npm run dev:vendor-portal; exec bash" \
  --tab --title="procurement-dashboard" -- bash -c "cd $(pwd) && npm run dev:procurement-dashboard; exec bash" \
  --tab --title="warehouse-receiving"   -- bash -c "cd $(pwd) && npm run dev:warehouse-receiving; exec bash" \
  --tab --title="inventory-ui"          -- bash -c "cd $(pwd) && npm run dev:inventory-ui; exec bash"
