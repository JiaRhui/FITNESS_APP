-- Seeds the curated facility list from the original facilities.json.
-- Idempotent: safe to re-run (ON CONFLICT DO NOTHING).
-- Owner: Nizam (gym locator)

INSERT INTO curated_facilities (name, address, lat, lng, type, public, fee) VALUES
  ('ActiveSG Bedok Stadium', '1 Bedok North Road, Singapore 469659', 1.3305, 103.9384, 'track', true, 'paid'),
  ('ActiveSG Jurong East Sports Centre', '21 Jurong East Street 31, Singapore 609517', 1.3344, 103.7404, 'gym', false, 'paid'),
  ('Anytime Fitness Tampines', '2 Tampines Central 5, Singapore 529509', 1.3521, 103.9444, 'gym', true, 'paid'),
  ('Bishan ActiveSG Gym', '5 Bishan Street 14, Singapore 579783', 1.3508, 103.8484, 'gym', true, 'paid'),
  ('Jalan Besar Stadium', '80 Tyrwhitt Road, Singapore 207565', 1.3098, 103.8634, 'track', false, 'paid'),
  ('Kallang Practice Track', '1 Kallang Gate Road, Singapore 397965', 1.3024, 103.8827, 'track', true, 'free'),
  ('Our Tampines Hub Sports Hub', '1 Tampines Walk, Singapore 528523', 1.3529, 103.9413, 'gym', true, 'free'),
  ('Pasir Ris Park Running Track', '120 Pasir Ris Central, Singapore 519640', 1.3724, 103.9488, 'track', true, 'free'),
  ('Punggol Waterway Track', '11 Punggol Walk, Singapore 828670', 1.4031, 103.9096, 'track', true, 'free'),
  ('Anytime Fitness Choa Chu Kang', 'Choa Chu Kang Avenue 1, Singapore 683807', 1.3768478, 103.7452099, 'gym', true, 'paid'),
  ('Anytime Fitness Sengkang Rivervale', 'Rivervale Drive, Singapore 545082', 1.3924116, 103.9042704, 'gym', true, 'paid'),
  ('ActiveSG Gym Anchorvale', '57 Anchorvale Road, Singapore 544964', 1.3967149, 103.8864497, 'gym', true, 'free'),
  ('Sengkang Community Gym', '3 Sengkang Square, Singapore 545061', 1.3927, 103.8951, 'gym', true, 'free')
ON CONFLICT (name, lat, lng) DO NOTHING;
