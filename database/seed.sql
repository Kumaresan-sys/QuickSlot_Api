INSERT INTO venues (name, location)
VALUES
('Elite Badminton Court', 'Chennai'),
('PowerPlay Football Turf', 'Anna Nagar'),
('Smash Tennis Arena', 'Velachery'),
('Prime Cricket Nets', 'Guindy'),
('Urban Sports Hub', 'Tambaram');

INSERT INTO slots (venue_id, slot_time)
SELECT v.id, gs.slot_time
FROM venues v
CROSS JOIN generate_series(
    TIME '06:00',
    TIME '22:00',
    INTERVAL '1 hour'
) AS gs(slot_time);
