@echo off
echo 🚀 Starting Travel Chat System Setup...

echo 📦 Starting Docker services...
docker-compose up -d

echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak


echo ✅ Setup complete!
echo.
echo 🌐 Access your services:
echo    Frontend: http://localhost:3000
echo    Directus: http://localhost:8055
echo    n8n: http://localhost:5678
echo.
echo 📋 Next steps:
echo    1. Import the n8n workflow from n8n-workflow-chat.json
echo    2. Activate the workflow in n8n
echo    3. Test the chat functionality
pause
