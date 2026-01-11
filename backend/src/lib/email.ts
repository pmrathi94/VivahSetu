import nodemailer from 'nodemailer'
import { config } from '../config'
import Mail from 'nodemailer/lib/mailer'

let transporter: Mail | null = null

async function getTransporter() {
  if (transporter) return transporter

  // Dev: use Ethereal if MAIL_PROVIDER=ethereal or no SMTP provided
  const useEthereal = (config.MAIL_PROVIDER === 'ethereal') || (!config.SMTP_HOST && !config.SENDGRID_API_KEY && config.NODE_ENV !== 'production')

  if (useEthereal) {
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    })
    return transporter
  }

  // Production/dev with SMTP
  if (config.SMTP_HOST && config.SMTP_PORT && config.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER || undefined,
        pass: config.SMTP_PASS || undefined
      }
    })
    return transporter
  }

  // Fallback: throw
  throw new Error('No mail transport configured; set SMTP_* env vars or MAIL_PROVIDER=ethereal')
}

export async function sendEmail(opts: {
  to: string
  subject: string
  html?: string
  text?: string
}) {
  const t = await getTransporter()
  const from = config.EMAIL_FROM || 'no-reply@vivahsetu.com'

  const info = await t.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html
  })

  // If using Ethereal, provide preview URL
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodemailerLib = require('nodemailer')
  const preview = (nodemailerLib.getTestMessageUrl && nodemailerLib.getTestMessageUrl(info)) || null

  return { info, preview }
}
