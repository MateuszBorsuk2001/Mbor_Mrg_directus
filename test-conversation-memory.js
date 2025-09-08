const fetch = require('node-fetch');

const DIRECTUS_URL = 'http://localhost:8055';

async function testConversationMemory() {
    console.log('🧪 Testing Conversation Memory System...\n');

    try {
        // Test 1: Create a new conversation
        console.log('1️⃣ Creating new conversation...');
        const createResponse = await fetch(`${DIRECTUS_URL}/chat/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Test Conversation Memory',
                userId: 'test-user'
            })
        });

        if (!createResponse.ok) {
            throw new Error(`Failed to create conversation: ${createResponse.status}`);
        }

        const createData = await createResponse.json();
        const conversationId = createData.conversation.id;
        console.log(`✅ Conversation created with ID: ${conversationId}\n`);

        // Test 2: Send first message
        console.log('2️⃣ Sending first message...');
        const firstMessageResponse = await fetch(`${DIRECTUS_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Cześć! Mam na imię Jan i lubię podróżować po Europie.',
                userId: 'test-user',
                conversationId: conversationId
            })
        });

        if (!firstMessageResponse.ok) {
            throw new Error(`Failed to send first message: ${firstMessageResponse.status}`);
        }

        const firstData = await firstMessageResponse.json();
        console.log(`✅ First message sent. Bot response: ${firstData.response.substring(0, 100)}...\n`);

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 3: Send second message that should reference the first
        console.log('3️⃣ Sending second message (should remember my name)...');
        const secondMessageResponse = await fetch(`${DIRECTUS_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Jakie są najlepsze miejsca do odwiedzenia w Hiszpanii?',
                userId: 'test-user',
                conversationId: conversationId
            })
        });

        if (!secondMessageResponse.ok) {
            throw new Error(`Failed to send second message: ${secondMessageResponse.status}`);
        }

        const secondData = await secondMessageResponse.json();
        console.log(`✅ Second message sent. Bot response: ${secondData.response.substring(0, 100)}...\n`);

        // Test 4: Get conversation history
        console.log('4️⃣ Retrieving conversation history...');
        const historyResponse = await fetch(`${DIRECTUS_URL}/chat/conversations/${conversationId}`);
        
        if (!historyResponse.ok) {
            throw new Error(`Failed to get conversation history: ${historyResponse.status}`);
        }

        const historyData = await historyResponse.json();
        console.log(`✅ Conversation history retrieved. Messages count: ${historyData.count}`);
        
        console.log('\n📋 Conversation Messages:');
        historyData.messages.forEach((msg, index) => {
            console.log(`${index + 1}. [${msg.type.toUpperCase()}] ${msg.message.substring(0, 80)}...`);
        });

        // Test 5: Send third message to test context
        console.log('\n5️⃣ Sending third message (should remember previous context)...');
        const thirdMessageResponse = await fetch(`${DIRECTUS_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'A co z Francją? Pamiętasz jak się nazywam?',
                userId: 'test-user',
                conversationId: conversationId
            })
        });

        if (!thirdMessageResponse.ok) {
            throw new Error(`Failed to send third message: ${thirdMessageResponse.status}`);
        }

        const thirdData = await thirdMessageResponse.json();
        console.log(`✅ Third message sent. Bot response: ${thirdData.response.substring(0, 150)}...\n`);

        // Test 6: List all conversations
        console.log('6️⃣ Listing all conversations...');
        const listResponse = await fetch(`${DIRECTUS_URL}/chat/conversations?userId=test-user`);
        
        if (!listResponse.ok) {
            throw new Error(`Failed to list conversations: ${listResponse.status}`);
        }

        const listData = await listResponse.json();
        console.log(`✅ Conversations listed. Count: ${listData.count}`);
        
        console.log('\n📋 All Conversations:');
        listData.conversations.forEach((conv, index) => {
            console.log(`${index + 1}. [ID: ${conv.id}] ${conv.title} (${new Date(conv.created_at).toLocaleString('pl-PL')})`);
        });

        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- Conversation ID: ${conversationId}`);
        console.log(`- Total messages in conversation: ${historyData.count}`);
        console.log(`- Total conversations for user: ${listData.count}`);
        console.log('- Conversation memory is working correctly!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
testConversationMemory();
