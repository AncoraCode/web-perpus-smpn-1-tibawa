import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendMail } from '@/utils/send-mail'

function maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (!local || !domain) return email
    if (local.length <= 2) {
        return `${local[0]}*@${domain}`
    }
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
}

export async function POST(request: NextRequest) {
    try {
        const { identifier } = await request.json()

        if (!identifier?.trim()) {
            return NextResponse.json({ error: 'Username atau Email wajib diisi' }, { status: 400 })
        }

        const supabase = await createClient()

        // Cari user berdasarkan username atau email
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, email, nama_lengkap, username')
            .or(`username.eq.${identifier.trim()},email.eq.${identifier.trim()}`)
            .maybeSingle()

        if (error || !profile) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 400 })
        }

        // Cek jika akun tidak memiliki email
        if (!profile.email || !profile.email.trim()) {
            return NextResponse.json({
                error: 'Reset password tidak dapat diproses karena akun Anda tidak memiliki email terdaftar. Silakan hubungi Administrator.'
            }, { status: 400 })
        }

        // Generate 6-digit numeric verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 menit

        // Simpan kode verifikasi ke database
        const { error: insertError } = await supabase
            .from('verification_codes')
            .insert([{
                email: profile.email,
                code: code,
                expires_at: expiresAt
            }])

        if (insertError) {
            console.error('Failed to store verification code:', insertError.message)
            return NextResponse.json({ error: 'Gagal membuat kode verifikasi' }, { status: 500 })
        }

        // Kirim email
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #1d4ed8; text-align: center;">Reset Password Perpustakaan</h2>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p>Halo <strong>${profile.nama_lengkap}</strong>,</p>
                <p>Kami menerima permintaan untuk mereset password akun Anda di Perpustakaan SMPN 1 Tibawa.</p>
                <p>Silakan gunakan kode verifikasi 6 digit di bawah ini untuk melanjutkan:</p>
                <div style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${code}</span>
                </div>
                <p style="color: #6b7280; font-size: 12px; text-align: center;">Kode verifikasi ini berlaku selama 15 menit. Jika Anda tidak merasa meminta reset password, abaikan email ini.</p>
            </div>
        `

        await sendMail({
            to: profile.email,
            subject: 'Kode Verifikasi Lupa Password',
            html: htmlContent
        })

        return NextResponse.json({
            success: true,
            maskedEmail: maskEmail(profile.email),
            email: profile.email
        })

    } catch (error: any) {
        console.error('Forgot password endpoint error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}
