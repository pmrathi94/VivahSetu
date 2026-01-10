import { z } from 'zod';

// Common validation schemas for form handling

export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens and apostrophes');

export const phoneSchema = z
  .string()
  .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
  .min(10, 'Phone number must be at least 10 digits');

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Signup validation
export const signupSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Reset password validation
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Forgot password validation
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Profile update validation
export const profileUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema.optional(),
  bio: z
    .string()
    .max(500, 'Bio must not exceed 500 characters')
    .optional(),
});

// Wedding details validation
export const weddingDetailsSchema = z.object({
  brideName: nameSchema,
  groomName: nameSchema,
  weddingDate: z
    .string()
    .refine((date) => new Date(date) > new Date(), 'Wedding date must be in the future'),
  location: z
    .string()
    .min(2, 'Location is required'),
  guestCount: z
    .number()
    .min(1, 'Guest count must be at least 1')
    .max(10000, 'Guest count cannot exceed 10000'),
});

// Vendor validation
export const vendorSchema = z.object({
  name: z
    .string()
    .min(2, 'Vendor name must be at least 2 characters'),
  category: z
    .string()
    .min(1, 'Category is required'),
  phone: phoneSchema,
  email: emailSchema,
  website: z
    .string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .min(2, 'Location is required'),
  rating: z
    .number()
    .min(0, 'Rating must be at least 0')
    .max(5, 'Rating must not exceed 5')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
});

// Guest validation
export const guestSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
  relation: z
    .string()
    .min(1, 'Relation is required'),
  status: z.enum(['pending', 'confirmed', 'declined']),
});

// Expense validation
export const expenseSchema = z.object({
  description: z
    .string()
    .min(2, 'Description must be at least 2 characters'),
  amount: z
    .number()
    .positive('Amount must be greater than 0'),
  category: z
    .string()
    .min(1, 'Category is required'),
  date: z
    .string()
    .refine((date) => new Date(date) <= new Date(), 'Expense date cannot be in the future'),
  vendor: z
    .string()
    .max(100, 'Vendor name must not exceed 100 characters')
    .optional(),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type WeddingDetailsFormData = z.infer<typeof weddingDetailsSchema>;
export type VendorFormData = z.infer<typeof vendorSchema>;
export type GuestFormData = z.infer<typeof guestSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
