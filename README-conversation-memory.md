# Conversation Memory System

## Overview

The conversation memory system adds persistent conversation context to the travel chat system. Each conversation has a unique ID and maintains a history of messages, allowing Ollama to provide contextually aware responses.

## Architecture

```
Frontend → Directus → n8n → Ollama
    ↑         ↓        ↓      ↓
    ←---------←--------←------←
```

### Data Flow with Memory

1. **Frontend** sends message with optional `conversationId`
2. **Directus** creates new conversation if needed, fetches conversation history
3. **n8n** receives message + conversation history, passes to Ollama
4. **Ollama** processes message with full conversation context
5. **Response** flows back through the chain, saving to database

## Database Schema

### Conversations Table
```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Chat Messages Table (Updated)
```sql
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('user', 'bot')),
    user_id VARCHAR(255),
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent',
    original_message_id INTEGER REFERENCES chat_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Directus Chat Extension

#### `GET /chat/conversations`
Get all conversations for a user
- Query params: `userId` (default: 'anonymous')
- Returns: Array of conversations

#### `GET /chat/conversations/:id`
Get messages for a specific conversation
- Returns: Array of messages (oldest first for context)

#### `POST /chat/conversations`
Create a new conversation
- Body: `{ title, userId }`
- Returns: Created conversation object

#### `POST /chat` (Updated)
Send a message (with conversation support)
- Body: `{ message, userId, conversationId? }`
- If no `conversationId`, creates new conversation
- Fetches conversation history and passes to n8n
- Returns: Response with `conversationId`

## Frontend Features

### Conversation Management
- **Conversation Selector**: Dropdown to choose existing conversations
- **New Conversation**: Button to create new conversations
- **Active Conversation Display**: Shows current conversation title
- **Auto-load History**: Loads message history when selecting conversation

### UI Components
- Toggle button to show/hide conversation panel
- Conversation list with titles and dates
- Seamless switching between conversations
- Automatic conversation creation for new chats

## n8n Workflow Updates

### Chat LLM Chain Node
Updated prompt to include conversation history:
```
You are a helpful AI travel assistant. Respond to the user's message in a friendly and informative way.

Previous conversation context:
user: [previous user message]
assistant: [previous bot response]
...

Current user message: [current message]
```

### Response Node
Returns conversation ID along with response for frontend tracking.

## Setup Instructions

### 1. Database Migration
For existing installations, run the migration script:
```bash
psql -h localhost -U postgres -d directus -f migrate-conversation-schema.sql
```

For new installations, the updated `init-chat-schema.sql` includes conversation support.

### 2. Restart Services
```bash
docker-compose down
docker-compose up -d
```

### 3. Test the System
```bash
node test-conversation-memory.js
```

## Testing

### Manual Testing
1. Open frontend chat interface
2. Click "Rozmowy" to show conversation panel
3. Create new conversation or select existing
4. Send messages and verify context is maintained
5. Switch between conversations to test isolation

### Automated Testing
Run the test script to verify:
- Conversation creation
- Message history retrieval
- Context passing to Ollama
- Conversation listing

## Key Features

### ✅ Conversation Isolation
Each conversation maintains separate message history

### ✅ Context Awareness
Ollama receives full conversation history for contextually aware responses

### ✅ Automatic Conversation Creation
New conversations created automatically when none specified

### ✅ Frontend Integration
Seamless conversation management in the UI

### ✅ Database Optimization
Proper indexing for fast conversation and message queries

### ✅ Backward Compatibility
Existing messages can be migrated to default conversation

## Troubleshooting

### Common Issues

1. **No conversation history**: Check if `conversation_id` is being passed correctly
2. **Context not working**: Verify n8n workflow is receiving `conversationHistory`
3. **Frontend not loading conversations**: Check Directus endpoint responses
4. **Database errors**: Ensure migration script ran successfully

### Debug Commands

```bash
# Check database schema
psql -h localhost -U postgres -d directus -c "\d conversations"
psql -h localhost -U postgres -d directus -c "\d chat_messages"

# Test Directus endpoints
curl http://localhost:8055/chat/conversations?userId=test
curl http://localhost:8055/chat/conversations/1

# Check n8n logs
docker logs travel-advisor-n8n-1
```

## Performance Considerations

- Conversation history limited to last 20 messages for context
- Database indexes on `conversation_id` and `user_id`
- Efficient queries with proper sorting and limiting
- Frontend caches conversation list for better UX

## Future Enhancements

- Conversation search and filtering
- Conversation export/import
- Message threading within conversations
- Conversation sharing between users
- Advanced conversation analytics
