const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3001;

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

const dbHost = process.env.DB_HOST || (process.env.DOCKER_ENV === 'true' ? 'database' : 'localhost');
const dbPool = new Pool({
  host: dbHost,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'directus',
  user: process.env.DB_USER || 'directus',
  password: process.env.DB_PASSWORD || 'directus',
});

dbPool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const isDocker = process.env.DOCKER_ENV === 'true' || process.env.N8N_URL?.includes('n8n:');
const n8nHost = isDocker ? 'n8n' : 'localhost';
const N8N_URL = process.env.N8N_URL || `http://${n8nHost}:5678`;

app.get('/test', (req, res) => {
  res.json({ message: 'Chat server is working!', timestamp: new Date().toISOString() });
});

app.post('/chat', async (req, res) => {
  try {
    const { message, userId, conversationId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const result = await dbPool.query(
        'INSERT INTO conversations (title, user_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id',
        [`Rozmowa ${new Date().toLocaleString('pl-PL')}`, userId]
      );
      currentConversationId = result.rows[0].id;
    }

    const historyResult = await dbPool.query(
      'SELECT * FROM chat_messages WHERE conversation_id = $1 AND user_id = $2 ORDER BY timestamp DESC LIMIT 10',
      [currentConversationId, userId]
    );
    const historyMessages = historyResult.rows.reverse().map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.message
    }));

    const userMsgResult = await dbPool.query(
      'INSERT INTO chat_messages (message, type, user_id, conversation_id, timestamp, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), NOW()) RETURNING id',
      [message, 'user', userId, currentConversationId, 'sent']
    );
    const userMessageId = userMsgResult.rows[0].id;

    try {
      const historyText = historyMessages.length > 0
        ? historyMessages.map(msg => `${msg.role === 'user' ? 'Użytkownik' : 'Asystent'}: ${msg.content}`).join('\n')
        : '';
      const n8nPayload = {
        message,
        chatInput: historyText,
        messageId: userMessageId,
        conversationId: currentConversationId,
        conversationHistory: historyMessages,
        userId,
        timestamp: new Date().toISOString(),
        source: 'chat-server'
      };
      const n8nResponse = await fetch(`${N8N_URL}/webhook/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload)
      });
      if (!n8nResponse.ok) throw new Error(`n8n webhook failed: ${n8nResponse.status}`);

      const responseText = await n8nResponse.text();
      let n8nData;
      try {
        n8nData = JSON.parse(responseText);
      } catch {
        n8nData = { response: responseText.trim() || 'No response from AI' };
      }
      const botResponse = n8nData.text || n8nData.response || 'No response from AI';

      const botMsgResult = await dbPool.query(
        'INSERT INTO chat_messages (message, type, user_id, conversation_id, timestamp, status, original_message_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), $5, $6, NOW(), NOW()) RETURNING id',
        [botResponse, 'bot', userId, currentConversationId, 'received', userMessageId]
      );

      res.json({
        success: true,
        userMessage: userMessageId,
        botMessage: botMsgResult.rows[0].id,
        response: botResponse,
        conversationId: currentConversationId
      });
    } catch (aiError) {
      await dbPool.query(
        'INSERT INTO chat_messages (message, type, user_id, conversation_id, timestamp, status, original_message_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), $5, $6, NOW(), NOW()) RETURNING id',
        ['Sorry, AI service is currently unavailable. Please try again.', 'bot', userId, currentConversationId, 'error', userMessageId]
      );
      res.status(503).json({
        success: false,
        userMessage: userMessageId,
        response: 'n8n/AI service unavailable',
        conversationId: currentConversationId,
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});
