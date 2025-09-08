
const testChatSystem = async () => {
  console.log('🧪 Testing Chat System...')
  
  try {
    const response = await fetch('http://localhost:8055/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you help me plan a trip to Barcelona?',
        userId: 'test-user'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Chat system is working!')
    console.log('🤖 Bot response:', data.response)
    console.log('📝 Message ID:', data.userMessage)
    
  } catch (error) {
    console.error('❌ Chat system test failed:', error.message)
    console.log('🔧 Please check:')
    console.log('   1. All Docker services are running')
    console.log('   2. Ollama model is pulled')
    console.log('   3. n8n workflow is active')
    console.log('   4. Directus extension is loaded')
  }
}

testChatSystem()
