 wojak n?# Travel Chat System with Directus, n8n, and Ollama

This system implements a chat interface that communicates through Directus → n8n → Ollama and back.

## Architecture

```
Frontend (Vue.js) → Directus → n8n → Ollama → n8n → Directus → Frontend
```

## Setup Instructions

### 1. Start the Docker Services

```bash
docker-compose up -d
```

### 2. Initialize Ollama Model

After the services are running, you need to pull a model for Ollama:

```bash
docker exec -it travel-advisor-ollama-1 ollama pull llama2
```

### 3. Import n8n Workflow

1. Access n8n at `http://localhost:5678`
2. Login with credentials: `admin` / `admin123`
3. Import the workflow from `n8n-workflow-chat.json`
4. Activate the workflow

### 4. Access the Application

- Frontend: `http://localhost:3000`
- Directus Admin: `http://localhost:8055` (admin@example.com / d1r3ctu5)
- n8n: `http://localhost:5678` (admin / admin123)

## How It Works

1. **Frontend**: User types a message in the chat interface
2. **Directus**: Receives the message via `/chat` endpoint and stores it in the database
3. **n8n**: Receives the message via webhook and forwards it to Ollama
4. **Ollama**: Processes the message using the llama2 model and returns a response
5. **n8n**: Receives the response and sends it back to Directus
6. **Directus**: Stores the bot response and returns it to the frontend
7. **Frontend**: Displays the response in the chat interface

## Database Schema

The system uses a `chat_messages` table with the following structure:

- `id`: Primary key
- `message`: The message text
- `type`: Either 'user' or 'bot'
- `user_id`: User identifier
- `timestamp`: When the message was sent
- `status`: Message status
- `original_message_id`: Reference to the original user message (for bot responses)

## Environment Variables

The frontend uses `VITE_DIRECTUS_URL` to connect to Directus. This is set to `http://localhost:8055` in the docker-compose file.

## Troubleshooting

1. **Ollama not responding**: Make sure the llama2 model is pulled
2. **n8n workflow not working**: Check that the workflow is active and the webhook URL is correct
3. **Directus endpoint not found**: Ensure the extension is properly loaded
4. **CORS issues**: Check that CORS is enabled in Directus configuration

## API Endpoints

- `POST /chat`: Send a message and get a response
- `GET /chat`: Retrieve chat history

## Example Usage

```javascript
// Send a message
const response = await fetch('http://localhost:8055/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me with travel?',
    userId: 'user123'
  })
})

const data = await response.json()
console.log(data.response) // Ollama's response
```
