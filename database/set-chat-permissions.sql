-- Set permissions for conversations and chat_messages collections
-- This grants the Authenticated role access to these collections

-- Grant permissions to conversations collection
INSERT INTO directus_permissions (role, collection, action, permissions, validation, presets, fields)
VALUES 
  ('a2c2b8c4-0a53-406d-99c3-b2e6aae48887', 'conversations', 'create', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, '{"user_id":"$CURRENT_USER"}', '*'),
  ('a2c2b8c4-0a53-406d-99c3-b2e6aae48887', 'conversations', 'read', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*'),
  ('a2c2b8c4-0a53-406d-99c3-b2e6aae48887', 'conversations', 'update', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*'),
  ('a2c2b8c4-0a53-406d-99c3-b2e6aae48887', 'conversations', 'delete', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*')
ON CONFLICT DO NOTHING;

-- Grant permissions to chat_messages collection
INSERT INTO directus_permissions (role, collection, action, permissions, validation, presets, fields)
VALUES 
  ('a2c2b8c4-0a53-406d-99c3-b2e6aae48887', 'chat_messages', 'create', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, '{"user_id":"$CURRENT_USER"}', '*'),
  ('a2c2b8c4-0a53-406d-99c3-b2e6aae48887', 'chat_messages', 'read', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*'),
  ('a2c2b8c4-0a53-406d-99c3-b2e6aae48887', 'chat_messages', 'update', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*'),
  ('a2c2b8c4-0a53-406d-99c3-b2e6aae48887', 'chat_messages', 'delete', '{"user_id":{"_eq":"$CURRENT_USER"}}', NULL, NULL, '*')
ON CONFLICT DO NOTHING;
