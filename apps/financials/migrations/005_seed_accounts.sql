INSERT INTO accounts (code, name, type, normal_balance) VALUES
  ('1000', 'Cash',                  'asset',     'debit'),
  ('1010', 'Card settlements',      'asset',     'debit'),
  ('1020', 'Gift card liability',   'asset',     'debit'),
  ('1200', 'Inventory',             'asset',     'debit'),
  ('2000', 'Accounts Payable',      'liability', 'credit'),
  ('2100', 'VAT Payable',           'liability', 'credit'),
  ('3000', 'Owner''s Equity',       'equity',    'credit'),
  ('4000', 'Sales Revenue',         'revenue',   'credit'),
  ('4100', 'Sales Returns',         'revenue',   'debit'),
  ('5000', 'Cost of Goods Sold',    'expense',   'debit'),
  ('5900', 'Cash Over / Short',     'expense',   'debit')
ON CONFLICT (code) DO NOTHING;
