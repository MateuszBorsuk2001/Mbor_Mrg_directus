-- Fix chat setup: Create tables and set permissions
-- This script ensures the conversations and chat_messages tables exist
-- and grants proper permissions to authenticated users

-- Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    user_id UUID REFERENCES directus_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('user', 'bot')),
    user_id UUID REFERENCES directus_users(id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent',
    original_message_id INTEGER REFERENCES chat_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Register collections in Directus
INSERT INTO directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields)
VALUES ('conversations', 'chat', 'User conversations', '{{title}}', false, false, '{}', null, false, null, null, 'created_at', 'all', '#6366F1', '[]')
ON CONFLICT (collection) DO NOTHING;

INSERT INTO directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields)
VALUES ('chat_messages', 'message', 'Chat messages', '{{message}}', false, false, '{}', null, false, null, null, 'timestamp', 'all', '#8B5CF6', '[]')
ON CONFLICT (collection) DO NOTHING;

-- Get or create Authenticated role ID
DO $$
DECLARE
    auth_role_id UUID;
BEGIN
    -- Try to get the Authenticated role
    SELECT id INTO auth_role_id FROM directus_roles WHERE name = 'Authenticated' LIMIT 1;
    
    -- If it doesn't exist, create it
    IF auth_role_id IS NULL THEN
        INSERT INTO directus_roles (id, name, icon, description, admin_access, app_access, enforce_tfa)
        VALUES (gen_random_uuid(), 'Authenticated', 'verified_user', 'Default role for authenticated users', false, true, false)
        RETURNING id INTO auth_role_id;
    END IF;
    
    -- Grant permissions to conversations collection
    INSERT INTO directus_permissions (role, collection, action, permissions, validation, presets, fields)
    VALUES 
      (auth_role_id, 'conversations', 'create', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, '{"user_id":"$CURRENT_USER"}', '*'),
      (auth_role_id, 'conversations', 'read', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*'),
      (auth_role_id, 'conversations', 'update', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*'),
      (auth_role_id, 'conversations', 'delete', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- Grant permissions to chat_messages collection
    INSERT INTO directus_permissions (role, collection, action, permissions, validation, presets, fields)
    VALUES 
      (auth_role_id, 'chat_messages', 'create', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, '{"user_id":"$CURRENT_USER"}', '*'),
      (auth_role_id, 'chat_messages', 'read', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*'),
      (auth_role_id, 'chat_messages', 'update', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*'),
      (auth_role_id, 'chat_messages', 'delete', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*')
    ON CONFLICT DO NOTHING;
END $$;
