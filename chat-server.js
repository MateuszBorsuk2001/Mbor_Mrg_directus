const express = require('express');
const fetch = require('node-fetch');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Simple in-memory storage for now (bypass database issues)
let chatHistory = [];
let messageId = 1;

console.log('⚠️ Using in-memory storage (no database connection)')

// Test endpoint
app.get('/test', (req, res) => {
  console.log('🧪 Test endpoint called!');
  res.json({ 
    message: 'Chat server is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    console.log('📝 Chat endpoint called!');
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('💬 Processing:', { message, userId });

    // Save user message to memory
    const userMessage = {
      id: messageId++,
      message,
      type: 'user',
      user_id: userId || 'anonymous',
      timestamp: new Date(),
      status: 'sent'
    };
    chatHistory.push(userMessage);
    console.log('✅ User message saved with ID:', userMessage.id);

    try {
      // Try direct Ollama call first
      console.log('🚀 Calling Ollama directly...');
      const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5:3b',
          prompt: message,
          stream: false
        })
      });

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama failed with status: ${ollamaResponse.status}`);
      }

      const ollamaData = await ollamaResponse.json();
      console.log('🤖 Ollama response:', ollamaData);

      const botResponse = ollamaData.response || 'No response from AI';

      // Save bot response to memory
      const botMessage = {
        id: messageId++,
        message: botResponse,
        type: 'bot',
        user_id: userId || 'anonymous',
        timestamp: new Date(),
        status: 'received',
        original_message_id: userMessage.id
      };
      chatHistory.push(botMessage);
      console.log('🤖 Bot message saved with ID:', botMessage.id);

      res.json({
        success: true,
        userMessage: userMessage.id,
        botMessage: botMessage.id,
        response: botResponse
      });

    } catch (aiError) {
      console.error('❌ AI Error:', aiError.message);
      
      // Save error message to memory
      const errorMessage = {
        id: messageId++,
        message: 'Sorry, AI service is unavailable. Please try again later.',
        type: 'bot',
        user_id: userId || 'anonymous',
        timestamp: new Date(),
        status: 'error',
        original_message_id: userMessage.id
      };
      chatHistory.push(errorMessage);
      
      res.json({
        success: false,
        userMessage: userMessage.id,
        botMessage: errorMessage.id,
        response: 'AI service unavailable',
        error: aiError.message
      });
    }

  } catch (error) {
    console.error('❌ Server Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Get chat history
app.get('/chat', async (req, res) => {
  try {
    console.log('📖 Getting chat history...');
    const messages = chatHistory.slice().reverse();
    
    console.log('📋 Retrieved', messages.length, 'messages');
    res.json({ 
      success: true, 
      messages: messages,
      count: messages.length 
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Chat server running on http://localhost:${PORT}`);
  console.log('✅ Routes available:');
  console.log('   GET  /test - Test endpoint');
  console.log('   POST /chat - Send message to AI');
  console.log('   GET  /chat - Get chat history');
});
