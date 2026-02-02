-- Travel Advisor Database Schema for Directus
-- This script creates basic travel-related collections

-- Create destinations collection
INSERT INTO directus.directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields, sort_null_last) 
VALUES ('destinations', 'location_on', 'Travel destinations', '{{name}}', false, false, '{}', 'status', true, 'archived', 'published', 'name', 'all', '#00C897', '[]', true)
ON CONFLICT (collection) DO NOTHING;

-- Create offers collection
INSERT INTO directus.directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields, sort_null_last) 
VALUES ('offers', 'flight', 'Travel offers and packages', '{{title}} - {{price}}', false, false, '{}', 'status', true, 'archived', 'published', 'created_at', 'all', '#FF6B6B', '[]', true)
ON CONFLICT (collection) DO NOTHING;

-- Create bookings collection
INSERT INTO directus.directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields, sort_null_last) 
VALUES ('bookings', 'book_online', 'Travel bookings', '{{customer_name}} - {{offer_title}}', false, false, '{}', 'status', true, 'cancelled', 'confirmed', 'created_at', 'all', '#4ECDC4', '[]', true)
ON CONFLICT (collection) DO NOTHING;

-- Create destinations fields
INSERT INTO directus.directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, required, group, validation, validation_message) VALUES
('destinations', 'id', 'uuid', 'input', '{}', 'raw', '{}', true, true, 1, 'full', '{}', true, null, '{}', null),
('destinations', 'name', null, 'input', '{"placeholder":"Enter destination name"}', 'formatted-value', '{}', false, false, 2, 'full', '{}', true, null, '{}', null),
('destinations', 'country', null, 'input', '{"placeholder":"Enter country"}', 'formatted-value', '{}', false, false, 3, 'full', '{}', true, null, '{}', null),
('destinations', 'description', null, 'input-multiline', '{"placeholder":"Enter destination description"}', 'formatted-value', '{}', false, false, 4, 'full', '{}', false, null, '{}', null),
('destinations', 'image', null, 'file', '{"folder":"/destinations"}', 'file', '{}', false, false, 5, 'full', '{}', false, null, '{}', null),
('destinations', 'status', null, 'select-dropdown', '{"choices":[{"text":"Published","value":"published"},{"text":"Draft","value":"draft"},{"text":"Archived","value":"archived"}]}', 'labels', '{}', false, false, 6, 'full', '{}', true, null, '{}', null),
('destinations', 'created_at', 'date-created', 'datetime', '{}', 'datetime', '{}', true, false, 7, 'full', '{}', false, null, '{}', null),
('destinations', 'updated_at', 'date-updated', 'datetime', '{}', 'datetime', '{}', true, false, 8, 'full', '{}', false, null, '{}', null);

-- Create offers fields
INSERT INTO directus.directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, required, group, validation, validation_message) VALUES
('offers', 'id', 'uuid', 'input', '{}', 'raw', '{}', true, true, 1, 'full', '{}', true, null, '{}', null),
('offers', 'title', null, 'input', '{"placeholder":"Enter offer title"}', 'formatted-value', '{}', false, false, 2, 'full', '{}', true, null, '{}', null),
('offers', 'destination', 'm2o', 'select-dropdown-m2o', '{"template":"{{name}}","enableCreate":false}', 'related-values', '{}', false, false, 3, 'full', '{}', true, null, '{}', null),
('offers', 'price', null, 'input', '{"placeholder":"Enter price","step":"0.01","min":"0"}', 'formatted-value', '{}', false, false, 4, 'full', '{}', true, null, '{}', null),
('offers', 'departure_date', null, 'datetime', '{"placeholder":"Select departure date"}', 'datetime', '{}', false, false, 5, 'full', '{}', true, null, '{}', null),
('offers', 'return_date', null, 'datetime', '{"placeholder":"Select return date"}', 'datetime', '{}', false, false, 6, 'full', '{}', true, null, '{}', null),
('offers', 'available_spots', null, 'input', '{"placeholder":"Enter available spots","min":"0"}', 'formatted-value', '{}', false, false, 7, 'full', '{}', true, null, '{}', null),
('offers', 'description', null, 'input-multiline', '{"placeholder":"Enter offer description"}', 'formatted-value', '{}', false, false, 8, 'full', '{}', false, null, '{}', null),
('offers', 'status', null, 'select-dropdown', '{"choices":[{"text":"Available","value":"available"},{"text":"Booked","value":"booked"},{"text":"Archived","value":"archived"}]}', 'labels', '{}', false, false, 9, 'full', '{}', true, null, '{}', null),
('offers', 'created_at', 'date-created', 'datetime', '{}', 'datetime', '{}', true, false, 10, 'full', '{}', false, null, '{}', null),
('offers', 'updated_at', 'date-updated', 'datetime', '{}', 'datetime', '{}', true, false, 11, 'full', '{}', false, null, '{}', null);

-- Create bookings fields
INSERT INTO directus.directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, required, group, validation, validation_message) VALUES
('bookings', 'id', 'uuid', 'input', '{}', 'raw', '{}', true, true, 1, 'full', '{}', true, null, '{}', null),
('bookings', 'customer_name', null, 'input', '{"placeholder":"Enter customer name"}', 'formatted-value', '{}', false, false, 2, 'full', '{}', true, null, '{}', null),
('bookings', 'customer_email', null, 'input', '{"placeholder":"Enter customer email"}', 'formatted-value', '{}', false, false, 3, 'full', '{}', true, null, '{}', null),
('bookings', 'offer', 'm2o', 'select-dropdown-m2o', '{"template":"{{title}}","enableCreate":false}', 'related-values', '{}', false, false, 4, 'full', '{}', true, null, '{}', null),
('bookings', 'adults', null, 'input', '{"placeholder":"Number of adults","min":"1"}', 'formatted-value', '{}', false, false, 5, 'full', '{}', true, null, '{}', null),
('bookings', 'children', null, 'input', '{"placeholder":"Number of children","min":"0"}', 'formatted-value', '{}', false, false, 6, 'full', '{}', false, null, '{}', null),
('bookings', 'total_price', null, 'input', '{"placeholder":"Total price","step":"0.01","min":"0"}', 'formatted-value', '{}', false, false, 7, 'full', '{}', true, null, '{}', null),
('bookings', 'status', null, 'select-dropdown', '{"choices":[{"text":"Confirmed","value":"confirmed"},{"text":"Pending","value":"pending"},{"text":"Cancelled","value":"cancelled"}]}', 'labels', '{}', false, false, 8, 'full', '{}', true, null, '{}', null),
('bookings', 'created_at', 'date-created', 'datetime', '{}', 'datetime', '{}', true, false, 9, 'full', '{}', false, null, '{}', null),
('bookings', 'updated_at', 'date-updated', 'datetime', '{}', 'datetime', '{}', true, false, 10, 'full', '{}', false, null, '{}', null);
