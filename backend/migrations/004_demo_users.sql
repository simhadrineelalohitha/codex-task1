-- Development-only demo accounts; migrate.js skips this file in production.
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified)
VALUES (
  'admin@smartcart.ai',
  '$2b$12$me.BSAfdOd2oItaFV23ICensxVsKUI6F5hCwm.WQ7duwSlHo1CE3G',
  'Admin',
  'SmartCart',
  '+91-9876543210',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified)
VALUES (
  'customer@smartcart.ai',
  '$2b$12$arM58IHsB/oVC5FSGCKttOpgLVs43m3c3ZOEvYn51mDh2AG518lwy',
  'Priya',
  'Sharma',
  '+91-9876543211',
  'customer',
  true
) ON CONFLICT (email) DO NOTHING;
