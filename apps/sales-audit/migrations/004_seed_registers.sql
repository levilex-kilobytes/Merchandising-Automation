INSERT INTO registers (code, store_location) VALUES
  ('POS-01', 'Store #1'),
  ('POS-02', 'Store #1'),
  ('POS-03', 'Store #2'),
  ('POS-04', 'Store #3'),
  ('POS-05', 'Store #4')
ON CONFLICT (code) DO NOTHING;
