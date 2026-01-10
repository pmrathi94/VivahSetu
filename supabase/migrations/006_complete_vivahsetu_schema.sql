-- ============================================================================
-- VIVAHSETU 2026 - COMPLETE DATABASE SCHEMA
-- Progressive Web App for Indian Wedding Management
-- Supabase PostgreSQL Migration
-- ============================================================================

-- ============================================================================
-- 1. ROLES TABLE - Dynamic Role-Based Access Control
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) NOT NULL,
  permissions_json JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_name)
);

-- Insert default roles
INSERT INTO roles (role_name, permissions_json, description) VALUES
('app_owner', '{"manage_customers":true,"monitor_weddings":true,"set_defaults":true}', 'Super Admin - Manage all accounts'),
('customer_admin', '{"create_weddings":true,"manage_users":true,"export_data":true}', 'Customer Main Admin'),
('bride_groom', '{"full_access":true,"ai_toggle":true,"media_studio":true}', 'Wedding Main Admin - Bride/Groom'),
('wedding_admin', '{"shared_modules":true,"cannot_override_private":true}', 'Wedding Admin'),
('planner_admin', '{"manage_vendors":true,"manage_media":true,"manage_budget":true}', 'Shared Planner'),
('family_admin', '{"surprise_planning":true,"assist_packing":true,"limited_edit":true}', 'Family Admin'),
('family_member', '{"view_toggle":true}', 'Family Member'),
('friend_helper', '{"limited_edit":true,"assist_packing":true,"assist_functions":true}', 'Friend Helper'),
('friend', '{"read_only":true}', 'Friend'),
('guest', '{"rsvp":true,"view_wedding_card":true,"view_functions":true}', 'Guest'),
('deactivated', '{}', 'Deactivated User'),
('old_user', '{}', 'Old Post-Wedding User')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. USERS TABLE - Multi-Wedding User Management
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  role_id UUID REFERENCES roles(role_id),
  wedding_id UUID,
  status VARCHAR(20) DEFAULT 'active', -- active, deactivated, old
  language VARCHAR(10) DEFAULT 'en', -- en, hi, mr, mw
  theme_preference VARCHAR(20) DEFAULT 'light', -- light, dark, custom
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. WEDDINGS TABLE - Multi-Wedding Multi-Tenant Core
-- ============================================================================
CREATE TABLE IF NOT EXISTS weddings (
  wedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(user_id),
  bride_id UUID REFERENCES users(user_id),
  groom_id UUID REFERENCES users(user_id),
  wedding_name VARCHAR(255),
  bride_name VARCHAR(255),
  groom_name VARCHAR(255),
  wedding_date DATE NOT NULL,
  wedding_time TIME,
  venue_name VARCHAR(255),
  venue_lat DECIMAL(10, 8),
  venue_lng DECIMAL(11, 8),
  theme VARCHAR(50) DEFAULT 'traditional', -- traditional, modern, fusion, royal
  logo_url VARCHAR(500),
  app_name VARCHAR(100) DEFAULT 'VivahSetu',
  language VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(3) DEFAULT 'INR',
  ai_enabled BOOLEAN DEFAULT FALSE,
  guest_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'planning', -- planning, live, completed, deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  wedding_date_for_deletion TIMESTAMP WITH TIME ZONE,
  deletion_reminder_sent BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- 4. FUNCTIONS TABLE - Wedding Functions & Rituals
-- ============================================================================
CREATE TABLE IF NOT EXISTS functions (
  function_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  function_name VARCHAR(100) NOT NULL,
  function_type VARCHAR(50), -- engagement, haldi, mehendi, sangeet, wedding, reception, honeymoon, other
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  venue_name VARCHAR(255),
  venue_lat DECIMAL(10, 8),
  venue_lng DECIMAL(11, 8),
  description TEXT,
  checklist_json JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, overdue, cancelled
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. VENDORS TABLE - Vendor Management with Location Caching
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendors (
  vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  vendor_name VARCHAR(255) NOT NULL,
  vendor_type VARCHAR(50), -- photographer, catering, decoration, music, venue, etc
  phone VARCHAR(20),
  email VARCHAR(255),
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(100),
  district VARCHAR(100),
  village VARCHAR(100),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  function_id UUID REFERENCES functions(function_id),
  rating DECIMAL(2, 1),
  feedback_json JSONB DEFAULT '[]',
  shared_toggle BOOLEAN DEFAULT FALSE,
  cost DECIMAL(12, 2),
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. BUDGET TABLE - Bride/Groom Individual & Shared Budgets
-- ============================================================================
CREATE TABLE IF NOT EXISTS budget (
  budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  budget_owner_id UUID REFERENCES users(user_id), -- Bride or Groom
  category VARCHAR(100), -- decoration, catering, photography, venue, music, attire, jewelry, gifts, other
  item_name VARCHAR(255),
  estimated_cost DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  paid_by UUID REFERENCES users(user_id),
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid, overdue
  shared_toggle BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. CHAT GROUPS TABLE - Function/Family/Friends Group Chat
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_groups (
  group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  function_id UUID REFERENCES functions(function_id),
  group_name VARCHAR(255) NOT NULL,
  group_type VARCHAR(50), -- function_chat, family_chat, friends_chat, surprise_planning
  members_json JSONB DEFAULT '[]',
  surprise_planning_toggle BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. CHAT MESSAGES TABLE - Real-Time Messaging
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES chat_groups(group_id),
  sender_id UUID NOT NULL REFERENCES users(user_id),
  message_text TEXT NOT NULL,
  attachments_json JSONB DEFAULT '[]',
  forwarded_from UUID REFERENCES chat_messages(message_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 9. MEDIA STUDIO TABLE - Photos/Videos with Versioning
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_studio (
  media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  created_by UUID NOT NULL REFERENCES users(user_id),
  media_type VARCHAR(50), -- image, video, poster, card, logo, design
  media_url VARCHAR(500) NOT NULL,
  media_version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES media_studio(media_id),
  role_access JSONB DEFAULT '[]', -- Array of role_ids with access
  has_watermark BOOLEAN DEFAULT TRUE,
  screenshot_prevention BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 10. KUNDALI TABLE - Astrological Matching
-- ============================================================================
CREATE TABLE IF NOT EXISTS kundali (
  kundali_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  bride_id UUID REFERENCES users(user_id),
  groom_id UUID REFERENCES users(user_id),
  bride_kundali_url VARCHAR(500),
  groom_kundali_url VARCHAR(500),
  muhurat_json JSONB DEFAULT '{}',
  kundali_matching_score DECIMAL(3, 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 11. PACKING LIST TABLE - Function-Specific Packing
-- ============================================================================
CREATE TABLE IF NOT EXISTS packing_list (
  list_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  function_id UUID REFERENCES functions(function_id),
  list_owner_id UUID REFERENCES users(user_id),
  items_json JSONB DEFAULT '[]',
  honeymoon_toggle BOOLEAN DEFAULT FALSE,
  assistance_enabled BOOLEAN DEFAULT TRUE,
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 12. NOTIFICATIONS TABLE - Push/Email Alerts
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  notif_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  user_id UUID NOT NULL REFERENCES users(user_id),
  notification_type VARCHAR(50), -- budget_alert, function_reminder, packing_update, rsvp_update, overdue_alert, emergency_alert
  content TEXT NOT NULL,
  read_status BOOLEAN DEFAULT FALSE,
  sent_via VARCHAR(20) DEFAULT 'in_app', -- in_app, email, push
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 13. THEMES TABLE - Dynamic Theme Management
-- ============================================================================
CREATE TABLE IF NOT EXISTS themes (
  theme_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  theme_name VARCHAR(100),
  colors_json JSONB DEFAULT '{}',
  logo_url VARCHAR(500),
  app_name VARCHAR(100),
  font_family VARCHAR(100),
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 14. AI TOGGLE TABLE - GDPR-Safe AI Features
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_toggle (
  toggle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  feature_name VARCHAR(100), -- vendor_suggestions, menu_suggestions, costume_suggestions, packing_suggestions, budget_suggestions
  enabled BOOLEAN DEFAULT FALSE,
  bride_groom_only BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 15. OTP LOGS TABLE - Secure Authentication
-- ============================================================================
CREATE TABLE IF NOT EXISTS otp_logs (
  otp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ADDITIONAL TABLES FOR ADVANCED FEATURES
-- ============================================================================

-- RSVP Tracking
CREATE TABLE IF NOT EXISTS rsvp (
  rsvp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  guest_id UUID REFERENCES users(user_id),
  guest_email VARCHAR(255),
  function_id UUID REFERENCES functions(function_id),
  rsvp_status VARCHAR(20) DEFAULT 'pending', -- yes, no, maybe, pending
  menu_preference TEXT,
  allergies TEXT,
  plus_ones INTEGER DEFAULT 0,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  user_id UUID REFERENCES users(user_id),
  module_name VARCHAR(100),
  action VARCHAR(50), -- create, update, delete, view
  record_id VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Galleries
CREATE TABLE IF NOT EXISTS galleries (
  gallery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id),
  function_id UUID REFERENCES functions(function_id),
  gallery_name VARCHAR(255),
  media_ids JSONB DEFAULT '[]',
  role_access JSONB DEFAULT '[]',
  ai_tagging_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_studio ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;

-- Users RLS: Users can only see their own record and wedding members
CREATE POLICY users_rls ON users FOR SELECT
  USING (user_id = auth.uid() OR wedding_id IN (
    SELECT wedding_id FROM weddings WHERE bride_id = auth.uid() OR groom_id = auth.uid()
  ));

-- Weddings RLS: Users can only see weddings they're part of
CREATE POLICY weddings_rls ON weddings FOR SELECT
  USING (customer_id = auth.uid() OR bride_id = auth.uid() OR groom_id = auth.uid() OR
    wedding_id IN (SELECT wedding_id FROM users WHERE user_id = auth.uid()));

-- Functions RLS: Access per wedding_id
CREATE POLICY functions_rls ON functions FOR SELECT
  USING (wedding_id IN (SELECT wedding_id FROM weddings WHERE 
    customer_id = auth.uid() OR bride_id = auth.uid() OR groom_id = auth.uid()));

-- Budget RLS: Users see their own or shared budgets
CREATE POLICY budget_rls ON budget FOR SELECT
  USING (budget_owner_id = auth.uid() OR shared_toggle = TRUE OR
    wedding_id IN (SELECT wedding_id FROM weddings WHERE bride_id = auth.uid() OR groom_id = auth.uid()));

-- Chat RLS: Users see only their chat groups
CREATE POLICY chat_rls ON chat_groups FOR SELECT
  USING (members_json @> to_jsonb(auth.uid()::text));

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wedding_id ON users(wedding_id);
CREATE INDEX idx_weddings_customer_id ON weddings(customer_id);
CREATE INDEX idx_weddings_bride_groom ON weddings(bride_id, groom_id);
CREATE INDEX idx_weddings_date ON weddings(wedding_date);
CREATE INDEX idx_functions_wedding ON functions(wedding_id);
CREATE INDEX idx_functions_date ON functions(scheduled_date);
CREATE INDEX idx_vendors_wedding ON vendors(wedding_id);
CREATE INDEX idx_vendors_location ON vendors(location_lat, location_lng);
CREATE INDEX idx_budget_wedding ON budget(wedding_id);
CREATE INDEX idx_budget_owner ON budget(budget_owner_id);
CREATE INDEX idx_chat_wedding ON chat_groups(wedding_id);
CREATE INDEX idx_messages_group ON chat_messages(group_id);
CREATE INDEX idx_media_wedding ON media_studio(wedding_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_rsvp_wedding ON rsvp(wedding_id);
CREATE INDEX idx_audit_wedding ON audit_logs(wedding_id);

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Sample customer and wedding
INSERT INTO users (name, email, role_id, status, language)
VALUES ('Test Customer', 'customer@vivahsetu.com', 
  (SELECT role_id FROM roles WHERE role_name = 'customer_admin'),
  'active', 'en')
ON CONFLICT DO NOTHING;

INSERT INTO weddings (
  customer_id,
  bride_name,
  groom_name,
  wedding_name,
  wedding_date,
  venue_name,
  theme,
  language,
  currency,
  status
) VALUES (
  (SELECT user_id FROM users WHERE email = 'customer@vivahsetu.com' LIMIT 1),
  'Bride Name',
  'Groom Name',
  'Sample Wedding 2026',
  '2026-03-15',
  'Sample Venue',
  'traditional',
  'en',
  'INR',
  'planning'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ENABLE REALTIME FOR KEY TABLES
-- ============================================================================

ALTER TABLE functions REPLICA IDENTITY FULL;
ALTER TABLE budget REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE media_studio REPLICA IDENTITY FULL;

-- End of Schema
