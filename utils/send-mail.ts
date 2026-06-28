import nodemailer from 'nodemailer'

interface SendMailParams {
    to: string
    subject: string
    html: string
}

export async function sendMail({ to, subject, html }: SendMailParams) {
    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASSWORD
    const from = process.env.SMTP_FROM || user

    // Jika SMTP belum dikonfigurasi, gunakan Mock Fallback
    if (!host || !user || !pass) {
        console.warn('⚠️ SMTP credentials not fully configured. Falling back to Mock Console Mailer.')
        console.log(`
==================================================
📧 [MOCK EMAIL SENT]
Ke:      ${to}
Subjek:  ${subject}
Isi:
${html.replace(/<[^>]*>/g, '')}
==================================================
        `)
        return { success: true, mock: true }
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true untuk port 465, false untuk port lainnya
            auth: {
                user,
                pass,
            },
        })

        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
        })

        console.log(`✉️ Email successfully sent to ${to}: ${info.messageId}`)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error('❌ Failed to send email via SMTP:', error)
        throw error
    }
}
