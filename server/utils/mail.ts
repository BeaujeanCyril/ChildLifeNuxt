import nodemailer from 'nodemailer'
import 'dotenv/config'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: `"Mission Coop" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html
  })
}
