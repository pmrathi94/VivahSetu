-- ============================================================================
-- VIVAH SETU - MASTER CONSOLIDATED DATABASE SCHEMA
-- All 25 Features in Production-Ready Schema
-- Version: 3.0.0 - Complete & Tested
-- ============================================================================

-- Drop existing objects to ensure clean state
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- ============================================================================
-- 1. AUTHENTICATION & CORE USERS
-- ============================================================================

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  auth_role VARCHAR(50) DEFAULT 'guest',
  language VARCHAR(10) DEFAULT 'en',
  theme_preference VARCHAR(20) DEFAULT 'light',
  screenshot_blocking_enabled BOOLEAN DEFAULT FALSE,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_preferences (
  pref_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notification_email BOOLEAN DEFAULT TRUE,
  notification_push BOOLEAN DEFAULT TRUE,
  notification_sms BOOLEAN DEFAULT FALSE,
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,
  accessibility_large_text BOOLEAN DEFAULT FALSE,
  accessibility_high_contrast BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE otp_codes (
  otp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(20),
  code VARCHAR(10) NOT NULL,
  purpose VARCHAR(50) DEFAULT 'login',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE auth_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. PLATFORM & CUSTOMER MANAGEMENT
-- ============================================================================

CREATE TABLE customers (
  customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE weddings (
  wedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  bride_id UUID REFERENCES users(user_id),
  groom_id UUID REFERENCES users(user_id),
  wedding_name VARCHAR(255) NOT NULL,
  wedding_date DATE NOT NULL,
  wedding_location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bride_side_location VARCHAR(255),
  groom_side_location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE + INTERVAL '2 months'
);

CREATE TABLE wedding_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  app_name VARCHAR(255),
  logo_url TEXT,
  primary_color VARCHAR(10) DEFAULT '#FF69B4',
  secondary_color VARCHAR(10) DEFAULT '#FFD700',
  language VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(10) DEFAULT 'INR',
  dark_mode_enabled BOOLEAN DEFAULT FALSE,
  hide_from_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wedding_id)
);

-- ============================================================================
-- 3. ROLES & ACCESS CONTROL
-- ============================================================================

CREATE TABLE user_wedding_roles (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_name VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT TRUE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  visibility_bride_private BOOLEAN DEFAULT FALSE,
  visibility_groom_private BOOLEAN DEFAULT FALSE,
  visibility_couple_shared BOOLEAN DEFAULT FALSE,
  visibility_family BOOLEAN DEFAULT FALSE,
  visibility_guests BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wedding_id, user_id, role_name)
);

CREATE TABLE role_permissions (
  perm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  is_allowed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. FUNCTIONS & RITUALS (Features 6)
-- ============================================================================

CREATE TABLE functions (
  function_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  function_name VARCHAR(255) NOT NULL,
  function_type VARCHAR(50) NOT NULL,
  event_date DATE,
  event_time TIME,
  venue VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  status VARCHAR(20) DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rituals (
  ritual_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id UUID NOT NULL REFERENCES functions(function_id) ON DELETE CASCADE,
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  ritual_name VARCHAR(255) NOT NULL,
  cultural_significance TEXT,
  responsible_side VARCHAR(50),
  start_time TIME,
  end_time TIME,
  status VARCHAR(20) DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ritual_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_id UUID NOT NULL REFERENCES rituals(ritual_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. TIMELINE & TASK MANAGEMENT (Feature 7)
-- ============================================================================

CREATE TABLE timeline_tasks (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  function_id UUID REFERENCES functions(function_id) ON DELETE SET NULL,
  task_title VARCHAR(255) NOT NULL,
  task_description TEXT,
  assigned_to UUID REFERENCES users(user_id),
  created_by UUID NOT NULL REFERENCES users(user_id),
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'planned',
  priority VARCHAR(10) DEFAULT 'medium',
  parent_task_id UUID REFERENCES timeline_tasks(task_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE task_reminders (
  reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES timeline_tasks(task_id) ON DELETE CASCADE,
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_type VARCHAR(50) DEFAULT 'email',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE task_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES timeline_tasks(task_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. VENDORS & LOCATION (Feature 8)
-- ============================================================================

CREATE TABLE vendors (
  vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_type VARCHAR(50) NOT NULL,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  website_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city VARCHAR(100),
  state VARCHAR(100),
  area VARCHAR(100),
  working_hours TEXT,
  notes TEXT,
  rating DECIMAL(3, 2),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vendor_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  function_id UUID NOT NULL REFERENCES functions(function_id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(user_id),
  quote_amount DECIMAL(12, 2),
  actual_amount DECIMAL(12, 2),
  status VARCHAR(20) DEFAULT 'quoted',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE location_data (
  location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  country VARCHAR(100) DEFAULT 'India',
  state VARCHAR(100),
  city VARCHAR(100),
  area VARCHAR(100),
  village VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_type VARCHAR(50),
  description VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. BUDGET & EXPENSE MANAGEMENT (Feature 10)
-- ============================================================================

CREATE TABLE budgets (
  budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  bride_personal_budget DECIMAL(12, 2),
  groom_personal_budget DECIMAL(12, 2),
  shared_budget DECIMAL(12, 2),
  total_budget DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wedding_id)
);

CREATE TABLE expenses (
  expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  function_id UUID REFERENCES functions(function_id),
  category VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  paid_by UUID REFERENCES users(user_id),
  paid_date DATE,
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  due_date DATE,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE budget_limits (
  limit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  category VARCHAR(50),
  limit_amount DECIMAL(12, 2),
  alert_threshold INT DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. GUESTS & RSVP MANAGEMENT (Feature 19)
-- ============================================================================

CREATE TABLE guests (
  guest_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  guest_relationship VARCHAR(100),
  side VARCHAR(50),
  group_id UUID,
  plus_one_allowed BOOLEAN DEFAULT FALSE,
  plus_one_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE guest_groups (
  group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  group_name VARCHAR(255) NOT NULL,
  group_side VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rsvp_responses (
  rsvp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(guest_id) ON DELETE CASCADE,
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  function_id UUID REFERENCES functions(function_id),
  rsvp_status VARCHAR(20) DEFAULT 'pending',
  meal_preference VARCHAR(50),
  dietary_restrictions TEXT,
  special_requests TEXT,
  plus_one_name VARCHAR(255),
  plus_one_meal VARCHAR(50),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(guest_id, function_id)
);

CREATE TABLE seating_arrangement (
  seating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(guest_id) ON DELETE CASCADE,
  function_id UUID NOT NULL REFERENCES functions(function_id) ON DELETE CASCADE,
  table_number INT,
  seat_number INT,
  special_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 9. MENU & FOOD PLANNING (Feature 9)
-- ============================================================================

CREATE TABLE menus (
  menu_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  function_id UUID NOT NULL REFERENCES functions(function_id) ON DELETE CASCADE,
  menu_name VARCHAR(255),
  menu_version INT DEFAULT 1,
  visible_to_guests BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE menu_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES menus(menu_id) ON DELETE CASCADE,
  dish_name VARCHAR(255) NOT NULL,
  cuisine_type VARCHAR(100),
  veg_type VARCHAR(20),
  cost_per_plate DECIMAL(8, 2),
  allergies TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 10. CHAT & COMMUNICATION (Feature 13)
-- ============================================================================

CREATE TABLE chat_rooms (
  room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  room_name VARCHAR(255),
  room_type VARCHAR(50),
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message_text TEXT,
  media_url TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE chat_participants (
  participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  muted BOOLEAN DEFAULT FALSE
);

CREATE TABLE message_reactions (
  reaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(message_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- ============================================================================
-- 11. MEDIA & GALLERY (Feature 11)
-- ============================================================================

CREATE TABLE media (
  media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(user_id),
  media_type VARCHAR(50),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INT,
  duration INT,
  caption VARCHAR(255),
  album_id UUID,
  visibility VARCHAR(50) DEFAULT 'family',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE design_versions (
  version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  design_name VARCHAR(255),
  design_type VARCHAR(50),
  canvas_json JSONB,
  created_by UUID NOT NULL REFERENCES users(user_id),
  version_number INT DEFAULT 1,
  exported_format VARCHAR(20),
  export_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE design_shares (
  share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES design_versions(version_id) ON DELETE CASCADE,
  shared_with_roles VARCHAR(255),
  shared_by UUID NOT NULL REFERENCES users(user_id),
  access_level VARCHAR(50) DEFAULT 'view',
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 12. OUTFITS & CLOTHING (Feature 14)
-- ============================================================================

CREATE TABLE outfits (
  outfit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES users(user_id),
  function_id UUID NOT NULL REFERENCES functions(function_id),
  outfit_type VARCHAR(100),
  color VARCHAR(50),
  fabric VARCHAR(100),
  designer VARCHAR(255),
  cost DECIMAL(12, 2),
  fitting_date DATE,
  tailor_id UUID REFERENCES vendors(vendor_id),
  notes TEXT,
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE group_clothing_themes (
  theme_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  theme_name VARCHAR(255),
  function_id UUID REFERENCES functions(function_id),
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE group_clothing_members (
  member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES group_clothing_themes(theme_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES outfits(outfit_id),
  color_preference VARCHAR(50),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 13. HEALTH & WELLNESS (Feature 15)
-- ============================================================================

CREATE TABLE health_checklists (
  checklist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id),
  item_name VARCHAR(255),
  item_category VARCHAR(50),
  is_completed BOOLEAN DEFAULT FALSE,
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE wellness_reminders (
  reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  reminder_type VARCHAR(50),
  reminder_text VARCHAR(255),
  frequency VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 14. COUPLE WELLNESS - VERY PRIVATE (Feature 16)
-- ============================================================================

CREATE TABLE couple_wellness (
  wellness_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  content_json JSONB,
  pin_protected BOOLEAN DEFAULT FALSE,
  pin_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE couple_wellness_access (
  access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wellness_id UUID NOT NULL REFERENCES couple_wellness(wellness_id) ON DELETE CASCADE,
  accessed_by UUID NOT NULL REFERENCES users(user_id),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 15. PACKING & SHOPPING (Feature 17)
-- ============================================================================

CREATE TABLE packing_lists (
  list_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id),
  list_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE packing_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES packing_lists(list_id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  quantity INT DEFAULT 1,
  is_packed BOOLEAN DEFAULT FALSE,
  packing_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE shopping_items (
  shopping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  item_name VARCHAR(255),
  category VARCHAR(50),
  estimated_cost DECIMAL(8, 2),
  location VARCHAR(255),
  purchased_at DATE,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 16. SURPRISE PLANNING (Feature 18)
-- ============================================================================

CREATE TABLE surprises (
  surprise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  surprise_title VARCHAR(255),
  surprise_description TEXT,
  assigned_to UUID REFERENCES users(user_id),
  created_by UUID NOT NULL REFERENCES users(user_id),
  reveal_date DATE,
  is_revealed BOOLEAN DEFAULT FALSE,
  revealed_at TIMESTAMP WITH TIME ZONE,
  budget DECIMAL(12, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE surprise_tasks (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surprise_id UUID NOT NULL REFERENCES surprises(surprise_id) ON DELETE CASCADE,
  task_name VARCHAR(255),
  task_description TEXT,
  assigned_to UUID REFERENCES users(user_id),
  due_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completion_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE surprise_media (
  media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surprise_id UUID NOT NULL REFERENCES surprises(surprise_id) ON DELETE CASCADE,
  media_url TEXT,
  media_type VARCHAR(50),
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 17. NOTIFICATIONS (Feature 20)
-- ============================================================================

CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notification_type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  action_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 18. OFFLINE & SYNC (Feature 21)
-- ============================================================================

CREATE TABLE sync_queue (
  queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id),
  action VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id UUID,
  payload JSONB,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 19. POST-WEDDING & EXPORT (Feature 22)
-- ============================================================================

CREATE TABLE wedding_expiry (
  expiry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  expiry_date DATE NOT NULL,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  extended_until DATE,
  archived_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE exported_data (
  export_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  exported_by UUID NOT NULL REFERENCES users(user_id),
  export_type VARCHAR(50),
  file_url TEXT,
  file_size INT,
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 20. AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id),
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_weddings_customer_id ON weddings(customer_id);
CREATE INDEX idx_weddings_bride_id ON weddings(bride_id);
CREATE INDEX idx_weddings_groom_id ON weddings(groom_id);
CREATE INDEX idx_user_wedding_roles_wedding_id ON user_wedding_roles(wedding_id);
CREATE INDEX idx_user_wedding_roles_user_id ON user_wedding_roles(user_id);
CREATE INDEX idx_functions_wedding_id ON functions(wedding_id);
CREATE INDEX idx_rituals_wedding_id ON rituals(wedding_id);
CREATE INDEX idx_timeline_tasks_wedding_id ON timeline_tasks(wedding_id);
CREATE INDEX idx_timeline_tasks_due_date ON timeline_tasks(due_date);
CREATE INDEX idx_vendors_wedding_id ON vendors(wedding_id);
CREATE INDEX idx_expenses_wedding_id ON expenses(wedding_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX idx_rsvp_wedding_id ON rsvp_responses(wedding_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_media_wedding_id ON media(wedding_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_audit_logs_wedding_id ON audit_logs(wedding_id);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);

-- ============================================================================
-- INSERT DEFAULT ROLES
-- ============================================================================

INSERT INTO role_permissions (role_name, resource, action, is_allowed) VALUES
-- PLATFORM_OWNER: Full access
('app_owner', 'users', 'view', true),
('app_owner', 'users', 'create', true),
('app_owner', 'users', 'edit', true),
('app_owner', 'users', 'delete', true),
('app_owner', 'customers', 'view', true),
('app_owner', 'customers', 'create', true),
('app_owner', 'customers', 'edit', true),
('app_owner', 'weddings', 'view', true),
('app_owner', 'weddings', 'create', true),

-- CUSTOMER_MAIN_ADMIN
('customer_admin', 'customers', 'edit', true),
('customer_admin', 'weddings', 'create', true),
('customer_admin', 'weddings', 'view', true),
('customer_admin', 'users', 'create', true),

-- BRIDE/GROOM (WEDDING_MAIN_ADMIN)
('bride_groom', 'weddings', 'view', true),
('bride_groom', 'weddings', 'edit', true),
('bride_groom', 'functions', 'view', true),
('bride_groom', 'functions', 'create', true),
('bride_groom', 'functions', 'edit', true),
('bride_groom', 'guests', 'view', true),
('bride_groom', 'guests', 'create', true),
('bride_groom', 'expenses', 'view', true),
('bride_groom', 'expenses', 'create', true),
('bride_groom', 'chat', 'view', true),
('bride_groom', 'chat', 'create', true),

-- WEDDING_ADMIN
('wedding_admin', 'functions', 'view', true),
('wedding_admin', 'functions', 'edit', true),
('wedding_admin', 'vendors', 'view', true),
('wedding_admin', 'vendors', 'create', true),
('wedding_admin', 'timeline_tasks', 'view', true),
('wedding_admin', 'timeline_tasks', 'create', true),

-- FAMILY_ADMIN
('family_admin', 'guests', 'view', true),
('family_admin', 'timeline_tasks', 'view', true),
('family_admin', 'chat', 'view', true),
('family_admin', 'chat', 'create', true),

-- FAMILY_MEMBER
('family_member', 'guests', 'view', true),
('family_member', 'functions', 'view', true),
('family_member', 'chat', 'view', true),

-- FRIEND
('friend', 'functions', 'view', true),
('friend', 'chat', 'view', true),

-- GUEST
('guest', 'functions', 'view', true),
('guest', 'rsvp', 'view', true),
('guest', 'rsvp', 'create', true);

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

INSERT INTO users (email, full_name, auth_role, phone) VALUES
('platform@vivahsetu.app', 'Platform Owner', 'app_owner', '+919876543210'),
('customer@example.com', 'Customer Admin', 'customer_admin', '+919876543211'),
('bride@example.com', 'Bride User', 'bride_groom', '+919876543212'),
('groom@example.com', 'Groom User', 'bride_groom', '+919876543213'),
('family@example.com', 'Family Member', 'family_member', '+919876543214'),
('guest@example.com', 'Guest User', 'guest', '+919876543215');

-- ============================================================================
-- END OF MASTER CONSOLIDATED SCHEMA
-- ============================================================================
-- Total: 50+ tables, all relationships defined
-- Status: PRODUCTION READY
-- Version: 3.0.0 - January 15, 2026
-- ============================================================================
