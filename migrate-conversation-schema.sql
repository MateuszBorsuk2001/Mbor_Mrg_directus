-- Migration script to add conversation support to existing chat_messages table
-- Run this script if you already have a chat_messages table

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add conversation_id column to existing chat_messages table
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Optional: Create a default conversation for existing messages
-- Uncomment the following lines if you want to migrate existing messages to a default conversation

-- INSERT INTO conversations (title, user_id, created_at) 
-- VALUES ('Migrated Messages', 'anonymous', NOW());

-- UPDATE chat_messages 
-- SET conversation_id = (SELECT id FROM conversations WHERE title = 'Migrated Messages' LIMIT 1)
-- WHERE conversation_id IS NULL;

-- Show the updated schema
SELECT 
    'conversations' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversations'
UNION ALL
SELECT 
    'chat_messages' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_messages'
ORDER BY table_name, ordinal_position;
