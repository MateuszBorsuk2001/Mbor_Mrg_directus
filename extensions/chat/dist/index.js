import fetch from 'node-fetch';

export default (router, { services, getSchema, database }) => {
    console.log('🚀 Chat extension loading at /chat...');
    
    const { ItemsService } = services;

    // GET /chat - Test endpoint and chat history
    router.get('/', async (req, res) => {
        console.log('✅ GET /chat called');
        
        try {
            // Use database service

            // Get recent messages
            const messages = await database.raw(`
                SELECT * FROM chat_messages 
                ORDER BY timestamp DESC 
                LIMIT 50
            `);

            res.json({
                success: true,
                message: 'Chat endpoint is working!',
                timestamp: new Date().toISOString(),
                messages: messages.rows || [],
                count: (messages.rows || []).length
            });
        } catch (error) {
            console.error('❌ Error getting messages:', error);
            res.json({
                success: true,
                message: 'Chat endpoint is working!',
                timestamp: new Date().toISOString(),
                messages: [],
                count: 0,
                note: 'Database connection issue, but endpoint is active'
            });
        }
    });

    // GET /chat/conversations - Get all conversations for a user
    router.get('/conversations', async (req, res) => {
        console.log('📋 GET /chat/conversations called');
        
        try {
            const { userId = 'anonymous' } = req.query;
            
            const conversations = await database.raw(`
                SELECT * FROM conversations 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 100
            `, [userId]);

            res.json({
                success: true,
                conversations: conversations.rows || [],
                count: (conversations.rows || []).length
            });
        } catch (error) {
            console.error('❌ Error getting conversations:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get conversations',
                details: error.message
            });
        }
    });

    // GET /chat/conversations/:id - Get messages for a specific conversation
    router.get('/conversations/:id', async (req, res) => {
        console.log(`💬 GET /chat/conversations/${req.params.id} called`);
        
        try {
            const conversationId = req.params.id;
            
            const messages = await database.raw(`
                SELECT * FROM chat_messages 
                WHERE conversation_id = ? 
                ORDER BY timestamp ASC 
                LIMIT 100
            `, [conversationId]);

            res.json({
                success: true,
                conversationId: conversationId,
                messages: messages.rows || [],
                count: (messages.rows || []).length
            });
        } catch (error) {
            console.error('❌ Error getting conversation messages:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get conversation messages',
                details: error.message
            });
        }
    });

    // POST /chat/conversations - Create a new conversation
    router.post('/conversations', async (req, res) => {
        console.log('🆕 POST /chat/conversations called');
        
        try {
            const { title, userId = 'anonymous' } = req.body;
            
            const result = await database.raw(`
                INSERT INTO conversations (title, user_id, created_at, updated_at)
                VALUES (?, ?, NOW(), NOW())
                RETURNING *
            `, [title || `Rozmowa ${new Date().toLocaleString('pl-PL')}`, userId]);

            const conversation = result.rows[0];

            res.json({
                success: true,
                conversation: conversation
            });
        } catch (error) {
            console.error('❌ Error creating conversation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create conversation',
                details: error.message
            });
        }
    });

    // POST /chat - Main chat endpoint
    router.post('/', async (req, res) => {
        console.log('📝 POST /chat called');
        
        try {
            const { message, userId, conversationId } = req.body;
            
            if (!message) {
                console.log('❌ No message provided');
                return res.status(400).json({ 
                    success: false, 
                    error: 'Message is required' 
                });
            }

            console.log('💬 Processing message:', { message, userId, conversationId });

            // Use database service
            
            let currentConversationId = conversationId;
            
            // If no conversation ID provided, create a new conversation
            if (!currentConversationId) {
                console.log('🆕 Creating new conversation...');
                const newConversationResult = await database.raw(`
                    INSERT INTO conversations (title, user_id, created_at, updated_at)
                    VALUES (?, ?, NOW(), NOW())
                    RETURNING id
                `, [`Rozmowa ${new Date().toLocaleString('pl-PL')}`, userId || 'anonymous']);
                
                currentConversationId = newConversationResult.rows[0].id;
                console.log('✅ New conversation created:', currentConversationId);
            }

            // Get conversation history for context (limit to last 10 messages to avoid repetition)
            console.log('📚 Fetching conversation history...');
            const conversationHistory = await database.raw(`
                SELECT * FROM chat_messages 
                WHERE conversation_id = ? 
                ORDER BY timestamp DESC 
                LIMIT 10
            `, [currentConversationId]);
            
            console.log('🔍 Raw conversation history:', conversationHistory);
            console.log('🔍 History rows count:', (conversationHistory.rows || []).length);
            
            // Reverse to get chronological order (oldest first)
            const historyMessages = (conversationHistory.rows || []).reverse().map(msg => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.message
            }));
            
            console.log('🔍 Processed history messages:', historyMessages);

            // Save user message
            console.log('💾 Saving user message...');
            const userMessageResult = await database.raw(`
                INSERT INTO chat_messages (message, type, user_id, conversation_id, timestamp, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), ?, NOW(), NOW())
                RETURNING id
            `, [message, 'user', userId || 'anonymous', currentConversationId, 'sent']);
            
            const userMessage = userMessageResult.rows[0].id;
            console.log('✅ User message saved:', userMessage);

            // Call n8n webhook (which will call Ollama)
            console.log('🔄 Calling n8n webhook...');
            try {
                // Format conversation history more naturally (chronological order)
                const historyText = historyMessages.length > 0 
                    ? historyMessages.map(msg => `${msg.role === 'user' ? 'Użytkownik' : 'Asystent'}: ${msg.content}`).join('\n')
                    : '';
                
                const n8nPayload = {
                    message,
                    chatInput: historyText,  // Only history, not duplicated message
                    messageId: userMessage,
                    conversationId: currentConversationId,
                    conversationHistory: historyMessages,
                    timestamp: new Date().toISOString(),
                    source: 'directus'
                };

                console.log('📤 Sending to n8n:', n8nPayload);

                const n8nResponse = await fetch('http://n8n:5678/webhook/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(n8nPayload)
                });

                if (!n8nResponse.ok) {
                    throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
                }

                const responseText = await n8nResponse.text();
                console.log('📥 n8n raw response:', responseText);

                let n8nData;
                try {
                    n8nData = JSON.parse(responseText);
                    console.log('🎯 n8n parsed response:', n8nData);
                } catch (parseError) {
                    console.log('⚠️ Could not parse JSON, using as plain text');
                    n8nData = { 
                        response: responseText.trim() || 'No response from AI'
                    };
                }

                // n8n returns {text: "..."} format now
                const botResponse = n8nData.text || n8nData.response || 'No response from AI';

                // Save bot message
                console.log('💾 Saving bot message...');
                const botMessageResult = await database.raw(`
                    INSERT INTO chat_messages (message, type, user_id, conversation_id, timestamp, status, original_message_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), NOW())
                    RETURNING id
                `, [botResponse, 'bot', userId || 'anonymous', currentConversationId, 'received', userMessage]);
                
                const botMessage = botMessageResult.rows[0].id;
                console.log('✅ Bot message saved:', botMessage);

                // Return success response
                res.json({
                    success: true,
                    userMessage: userMessage,
                    botMessage: botMessage,
                    response: botResponse,
                    conversationId: currentConversationId
                });

            } catch (aiError) {
                console.error('❌ n8n/AI error:', aiError.message);
                
                // Save error message
                const errorMessageResult = await database.raw(`
                    INSERT INTO chat_messages (message, type, user_id, conversation_id, timestamp, status, original_message_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), NOW())
                    RETURNING id
                `, ['Sorry, AI service is currently unavailable. Please try again.', 'bot', userId || 'anonymous', currentConversationId, 'error', userMessage]);
                
                const errorMessage = errorMessageResult.rows[0].id;

                res.status(503).json({
                    success: false,
                    userMessage: userMessage,
                    botMessage: errorMessage,
                    response: 'n8n/AI service unavailable',
                    conversationId: currentConversationId,
                    error: aiError.message
                });
            }

        } catch (error) {
            console.error('❌ Chat endpoint error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: error.message
            });
        }
    });

    console.log('✅ Chat extension routes registered at /chat');
};
