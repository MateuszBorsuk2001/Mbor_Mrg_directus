-- Register chat collections in Directus
-- This script registers the conversations and chat_messages tables as Directus collections

-- Register conversations collection
INSERT INTO directus.directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields, sort_null_last) 
VALUES ('conversations', 'chat', 'User conversations', '{{title}}', false, false, '{}', null, false, null, null, 'created_at', 'all', '#6366F1', '[]', true)
ON CONFLICT (collection) DO NOTHING;

-- Register chat_messages collection
INSERT INTO directus.directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields, sort_null_last) 
VALUES ('chat_messages', 'message', 'Chat messages', '{{message}}', false, false, '{}', null, false, null, null, 'timestamp', 'all', '#8B5CF6', '[]', true)
ON CONFLICT (collection) DO NOTHING;

-- Register conversations fields
INSERT INTO directus.directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, required, group, validation, validation_message) VALUES
('conversations', 'id', 'integer', 'input', '{}', 'raw', '{}', true, true, 1, 'full', '{}', true, null, '{}', null),
('conversations', 'title', null, 'input', '{"placeholder":"Conversation title"}', 'formatted-value', '{}', false, false, 2, 'full', '{}', false, null, '{}', null),
('conversations', 'user_id', 'm2o', 'select-dropdown-m2o', '{"template":"{{email}}","enableCreate":false}', 'related-values', '{}', false, false, 3, 'full', '{}', true, null, '{}', null),
('conversations', 'created_at', 'date-created', 'datetime', '{}', 'datetime', '{}', true, false, 4, 'full', '{}', false, null, '{}', null),
('conversations', 'updated_at', 'date-updated', 'datetime', '{}', 'datetime', '{}', true, false, 5, 'full', '{}', false, null, '{}', null)
ON CONFLICT (collection, field) DO NOTHING;

-- Register chat_messages fields
INSERT INTO directus.directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, required, group, validation, validation_message) VALUES
('chat_messages', 'id', 'integer', 'input', '{}', 'raw', '{}', true, true, 1, 'full', '{}', true, null, '{}', null),
('chat_messages', 'message', null, 'input-multiline', '{"placeholder":"Message content"}', 'formatted-value', '{}', false, false, 2, 'full', '{}', true, null, '{}', null),
('chat_messages', 'type', null, 'select-dropdown', '{"choices":[{"text":"User","value":"user"},{"text":"Bot","value":"bot"}]}', 'labels', '{}', false, false, 3, 'full', '{}', true, null, '{}', null),
('chat_messages', 'user_id', 'm2o', 'select-dropdown-m2o', '{"template":"{{email}}","enableCreate":false}', 'related-values', '{}', false, false, 4, 'full', '{}', true, null, '{}', null),
('chat_messages', 'conversation_id', 'm2o', 'select-dropdown-m2o', '{"template":"{{title}}","enableCreate":false}', 'related-values', '{}', false, false, 5, 'full', '{}', true, null, '{}', null),
('chat_messages', 'timestamp', 'date-created', 'datetime', '{}', 'datetime', '{}', true, false, 6, 'full', '{}', false, null, '{}', null),
('chat_messages', 'status', null, 'select-dropdown', '{"choices":[{"text":"Sent","value":"sent"},{"text":"Received","value":"received"},{"text":"Error","value":"error"}]}', 'labels', '{}', false, false, 7, 'full', '{}', false, null, '{}', null),
('chat_messages', 'original_message_id', 'm2o', 'select-dropdown-m2o', '{"template":"{{message}}","enableCreate":false}', 'related-values', '{}', false, false, 8, 'full', '{}', false, null, '{}', null),
('chat_messages', 'created_at', 'date-created', 'datetime', '{}', 'datetime', '{}', true, false, 9, 'full', '{}', false, null, '{}', null),
('chat_messages', 'updated_at', 'date-updated', 'datetime', '{}', 'datetime', '{}', true, false, 10, 'full', '{}', false, null, '{}', null)
ON CONFLICT (collection, field) DO NOTHING;
