export default {
  id: 'chat',
  handler: (router, { database, logger }) => {
    logger.info('Chat endpoint extension loading at /chat...')

    const getUserId = (req) => req.accountability?.user ?? null

    const requireAuth = (req, res, next) => {
      const userId = getUserId(req)
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' })
      }
      next()
    }

    router.post('/', requireAuth, async (req, res) => {
      logger.info('POST /chat called')
      try {
        const { message, conversationId } = req.body
        const userId = getUserId(req)

        if (!message) {
          return res.status(400).json({ success: false, error: 'Message is required' })
        }

        let currentConversationId = conversationId

        if (currentConversationId) {
          const conversationCheck = await database.raw('SELECT user_id FROM conversations WHERE id = $1', [currentConversationId])
          const rows = conversationCheck?.rows ?? conversationCheck?.[0] ?? []
          if (!rows.length) {
            return res.status(404).json({ success: false, error: 'Conversation not found' })
          }
          if (rows[0].user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Access denied' })
          }
        }

        if (!currentConversationId) {
          const newConv = await database.raw(
            'INSERT INTO conversations (title, user_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id',
            [`Rozmowa ${new Date().toLocaleString('pl-PL')}`, userId]
          )
          const convRows = newConv?.rows ?? newConv?.[0] ?? []
          currentConversationId = convRows[0]?.id
        }

        const historyResult = await database.raw(
          'SELECT * FROM chat_messages WHERE conversation_id = $1 AND user_id = $2 ORDER BY timestamp DESC LIMIT 10',
          [currentConversationId, userId]
        )
        const historyRows = historyResult?.rows ?? historyResult?.[0] ?? []
        const historyMessages = [...historyRows].reverse().map((msg) => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.message
        }))

        const userMsgResult = await database.raw(
          'INSERT INTO chat_messages (message, type, user_id, conversation_id, timestamp, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), NOW()) RETURNING id',
          [message, 'user', userId, currentConversationId, 'sent']
        )
        const userMsgRows = userMsgResult?.rows ?? userMsgResult?.[0] ?? []
        const userMessage = userMsgRows[0]?.id

        try {
          const historyText = historyMessages.length > 0
            ? historyMessages.map((m) => `${m.role === 'user' ? 'Użytkownik' : 'Asystent'}: ${m.content}`).join('\n')
            : ''
          const n8nPayload = {
            message,
            chatInput: historyText,
            messageId: userMessage,
            conversationId: currentConversationId,
            conversationHistory: historyMessages,
            userId,
            timestamp: new Date().toISOString(),
            source: 'directus'
          }
          const n8nResponse = await fetch('http://n8n:5678/webhook/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(n8nPayload)
          })
          if (!n8nResponse.ok) throw new Error(`n8n webhook failed: ${n8nResponse.status}`)

          const responseText = await n8nResponse.text()
          let n8nData
          try {
            n8nData = JSON.parse(responseText)
          } catch {
            n8nData = { response: responseText.trim() || 'No response from AI' }
          }
          const botResponse = n8nData.text || n8nData.response || 'No response from AI'

          const botMsgResult = await database.raw(
            'INSERT INTO chat_messages (message, type, user_id, conversation_id, timestamp, status, original_message_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), $5, $6, NOW(), NOW()) RETURNING id',
            [botResponse, 'bot', userId, currentConversationId, 'received', userMessage]
          )
          const botMsgRows = botMsgResult?.rows ?? botMsgResult?.[0] ?? []
          const botMessage = botMsgRows[0]?.id

          res.json({
            success: true,
            userMessage,
            botMessage,
            response: botResponse,
            conversationId: currentConversationId
          })
        } catch (aiError) {
          logger.error('n8n/AI error:', aiError.message)
          const errMsgResult = await database.raw(
            'INSERT INTO chat_messages (message, type, user_id, conversation_id, timestamp, status, original_message_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), $5, $6, NOW(), NOW()) RETURNING id',
            ['Sorry, AI service is currently unavailable. Please try again.', 'bot', userId, currentConversationId, 'error', userMessage]
          )
          const errMsgRows = errMsgResult?.rows ?? errMsgResult?.[0] ?? []
          const errorMessageId = errMsgRows[0]?.id ?? userMessage
          res.status(503).json({
            success: false,
            userMessage,
            botMessage: errorMessageId,
            response: 'n8n/AI service unavailable',
            conversationId: currentConversationId,
            error: aiError.message
          })
        }
      } catch (error) {
        logger.error('Chat endpoint error:', error)
        res.status(500).json({ success: false, error: 'Internal server error', details: error.message })
      }
    })

    logger.info('Chat endpoint routes registered at /chat')
  }
}
