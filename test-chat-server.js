const fetch = require('node-fetch');

const testChatServer = async () => {
  console.log('🧪 Testing Direct Chat Server...');
  
  try {
    // Test the server
    console.log('🏓 Testing /test endpoint...');
    const testResponse = await fetch('http://localhost:3001/test');
    const testData = await testResponse.json();
    console.log('✅ Test endpoint working:', testData);

    // Test chat
    console.log('💬 Testing /chat endpoint...');
    const chatResponse = await fetch('http://localhost:3001/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello! Can you help me plan a trip to Barcelona?',
        userId: 'test-user'
      })
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat failed with status: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    console.log('✅ Chat system working!');
    console.log('🤖 Bot response:', chatData.response);
    console.log('📝 Message IDs:', { user: chatData.userMessage, bot: chatData.botMessage });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testChatServer();
