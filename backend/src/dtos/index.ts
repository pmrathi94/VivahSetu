// ============================================================================
// DTOs - Data Transfer Objects for API Communication
// ============================================================================

export interface CreateWeddingDTO {
  bride_id: string
  groom_id: string
  wedding_date: string
  wedding_name: string
  location?: string
  description?: string
}

export interface UpdateWeddingDTO {
  wedding_name?: string
  location?: string
  description?: string
  wedding_date?: string
}

export interface CreateUserRoleDTO {
  user_id: string
  role: string
  side?: 'bride' | 'groom'
}

export interface CreateBudgetDTO {
  budget_name: string
  allocated_amount: number
  budget_type?: string
  visibility_scope: string
  is_shared?: boolean
  assigned_to?: string
}

export interface CreateExpenseDTO {
  budget_id: string
  description: string
  amount: number
  expense_date?: string
  status?: string
  paid_by?: string
  paid_on_behalf_of?: string
}

export interface CreateVendorDTO {
  vendor_name: string
  category: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  budget?: number
}

export interface CreateFunctionDTO {
  name: string
  function_type: string
  start_date: string
  end_date?: string
  location?: string
  description?: string
  visibility_scope?: string
}

export interface CreateRitualDTO {
  ritual_name: string
  function_id?: string
  timing?: string
  meaning?: string
  pandit_notes?: string
  elder_description?: string
  visibility_scope?: string
}

export interface CreateMenuDTO {
  function_id?: string
  menu_name: string
  menu_type?: string
  caterer_id?: string
  veg_dishes: string[]
  non_veg_dishes: string[]
  jain_dishes: string[]
  dietary_notes?: string
}

export interface CreateTaskDTO {
  task_name: string
  description?: string
  assigned_to?: string
  due_date?: string
  priority?: string
  function_id?: string
}

export interface CreateChatMessageDTO {
  chat_room: string
  message?: string
  message_type: string
  media_url?: string
}

export interface UpdateAppSettingsDTO {
  app_name?: string
  wedding_name?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  dark_mode?: boolean
  font_family?: string
  language?: string
  currency?: string
  theme_preset?: string
}

export interface CreateGiftDTO {
  gift_name: string
  description?: string
  budget_estimate?: number
  gifter_name?: string
}

export interface CreateInvitationDTO {
  guest_email: string
  guest_name?: string
  guest_phone?: string
  relationship?: string
}

export interface CreateRSVPDTO {
  invitation_id?: string
  function_id: string
  rsvp_status: string
  dietary_preference?: string
  plus_one_count?: number
  notes?: string
}
