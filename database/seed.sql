INSERT INTO venues (name, location)
VALUES
('Elite Badminton Court', 'Chennai'),
('PowerPlay Football Turf', 'Anna Nagar'),
('Smash Tennis Arena', 'Velachery'),
('Prime Cricket Nets', 'Guindy'),
('Urban Sports Hub', 'Tambaram');

INSERT INTO slots (venue_id, slot_time)
SELECT v.id, gs.slot_time::time
FROM venues v
CROSS JOIN generate_series(
    '2000-01-01 06:00:00'::timestamp,
    '2000-01-01 22:00:00'::timestamp,
    '1 hour'::interval
) AS gs(slot_time);

-- Insert sample users
-- Password for both users is: password123
INSERT INTO users (name, email, password_hash)
VALUES
('John Doe', 'test@example.com', '$2b$10$zdzZcVTEUivyaaXUb39hA.0ZgafOfZJWSHUaEZpjUfrKrYucDBDXa'),
('Jane Smith', 'jane@example.com', '$2b$10$zdzZcVTEUivyaaXUb39hA.0ZgafOfZJWSHUaEZpjUfrKrYucDBDXa')
ON CONFLICT (email) DO NOTHING;
