const testConversationFlow = async () => {
  console.log('🧪 Testing Conversation Flow...')
  
  try {
    // First message
    console.log('\n📝 Sending first message...')
    const response1 = await fetch('http://localhost:8055/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Cześć! Chcę zaplanować wyjazd do Barcelony na weekend.',
        userId: 'test-user'
      })
    })

    const data1 = await response1.json()
    console.log('✅ First response:', data1.response)
    console.log('🆔 Conversation ID:', data1.conversationId)
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Second message in same conversation
    console.log('\n📝 Sending second message...')
    const response2 = await fetch('http://localhost:8055/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Jakie są najlepsze miejsca do zwiedzania?',
        userId: 'test-user',
        conversationId: data1.conversationId
      })
    })

    const data2 = await response2.json()
    console.log('✅ Second response:', data2.response)
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Third message
    console.log('\n📝 Sending third message...')
    const response3 = await fetch('http://localhost:8055/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'A co z transportem z lotniska?',
        userId: 'test-user',
        conversationId: data1.conversationId
      })
    })

    const data3 = await response3.json()
    console.log('✅ Third response:', data3.response)
    
  } catch (error) {
    console.error('❌ Conversation test failed:', error.message)
  }
}

testConversationFlow()
