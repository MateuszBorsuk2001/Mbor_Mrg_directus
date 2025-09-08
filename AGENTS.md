# Travel Chat System - Directus, n8n, Ollama Integration

## Build/Test Commands
- `docker-compose up -d` - Start all services (Directus, n8n, Ollama, PostgreSQL, Frontend)
- `setup-chat.bat` - Windows setup script to start services and display next steps
- `node test-chat.js` - Test the chat system endpoint
- `docker exec -it travel-advisor-ollama-1 ollama pull llama2` - Initialize Ollama model

## Architecture
- **Microservices**: Directus (CMS/API), n8n (workflow automation), Ollama (LLM), PostgreSQL (database), Frontend (Vue.js)
- **Data Flow**: Frontend → Directus `/chat` endpoint → n8n webhook → Ollama → n8n → Directus → Frontend
- **Database**: PostgreSQL with `chat_messages` table (id, message, type, user_id, timestamp, status, original_message_id)
- **Extensions**: Custom Directus endpoint extension in `extensions/chat/dist/index.js`

## Code Style & Conventions
- **JavaScript**: ES6+ modules, async/await pattern, destructuring assignment
- **Error Handling**: Try-catch blocks with detailed console.error logging and JSON error responses
- **API**: RESTful endpoints with proper HTTP status codes (400, 500)
- **Imports**: ES6 import syntax (`import fetch from 'node-fetch'`)
- **Naming**: camelCase for variables/functions, snake_case for database fields
- **Response Format**: JSON objects with `success`, `error`, or data properties
- **Environment**: Use Docker container networking (`http://n8n:5678`, `http://database:5432`)

## Development Workflow
- Extensions auto-reload enabled in Directus development mode
- Use `console.log` for debugging with emoji prefixes (🧪, ✅, ❌, 🔧)
- Test individual components with provided test scripts
