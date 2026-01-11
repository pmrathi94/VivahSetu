import { v4 as uuidv4 } from 'uuid'
import { sendEmail } from './email'
import { config } from '../config'
import { supabaseAdmin } from '../config/supabase'

type OtpRecord = { code: string; expiresAt: number }

// In-memory fallback store (dev). Keys: `${type}:${identifier}`
const store = new Map<string, OtpRecord>()

function generateCode(length = 6) {
  const digits = '0123456789'
  let code = ''
  for (let i = 0; i < length; i++) code += digits[Math.floor(Math.random() * digits.length)]
  return code
}

export async function createAndSendOtp(email: string, type = 'reset') {
  const code = generateCode(config.OTP_LENGTH || 6)
  const ttl = (config.OTP_TTL_SECONDS || 300) * 1000
  const expiresAt = Date.now() + ttl
  const key = `${type}:${email}`
  // Persist to Supabase table `otp_codes` if available (preferred)
  let persisted = false
  try {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from('otp_codes').insert({ id: uuidv4(), identifier: email, type, code, expires_at: new Date(expiresAt).toISOString() })
      if (!error) persisted = true
    }
  } catch (err) {
    // ignore DB errors and fall back to in-memory
    persisted = false
  }

  if (!persisted) {
    store.set(key, { code, expiresAt })
  }

  // Send email
  const { preview } = await sendEmail({
    to: email,
    subject: 'Your verification code',
    text: `Your verification code is: ${code}. It expires in ${Math.round(ttl / 1000)} seconds.`,
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in ${Math.round(ttl / 1000)} seconds.</p>`
  })

  return { code, expiresAt, preview }
}

export async function verifyOtp(email: string, code: string, type = 'reset') {
  const key = `${type}:${email}`

  // Check Supabase first
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('otp_codes')
        .select('*')
        .eq('identifier', email)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        const now = Date.now()
        const expiresAt = new Date(data.expires_at).getTime()
        if (now <= expiresAt && data.code === code) {
          // Optionally delete record
          await supabaseAdmin.from('otp_codes').delete().eq('id', data.id)
          return true
        }
        return false
      }
    }
  } catch (err) {
    // fall through to in-memory
  }

  const rec = store.get(key)
  if (!rec) return false
  if (Date.now() > rec.expiresAt) {
    store.delete(key)
    return false
  }
  if (rec.code !== code) return false
  store.delete(key)
  return true
}
