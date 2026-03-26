#!/bin/sh
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Running seed..."
node prisma/seed.js
echo "Starting auth service..."
exec node src/app.js
