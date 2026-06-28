import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { email, code, new_password } = await request.json()

        if (!email || !code || !new_password) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
        }

        if (new_password.length < 6) {
            return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Verifikasi kode
        const now = new Date().toISOString()
        const { data: codeData, error: codeError } = await supabase
            .from('verification_codes')
            .select('id')
            .eq('email', email.trim())
            .eq('code', code.trim())
            .gt('expires_at', now)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (codeError || !codeData) {
            return NextResponse.json({ error: 'Kode verifikasi salah atau telah kedaluwarsa' }, { status: 400 })
        }

        // 2. Cari ID user berdasarkan email
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.trim())
            .maybeSingle()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 400 })
        }

        // 3. Reset password menggunakan RPC update_user_password
        const { error: updateError } = await supabase.rpc('update_user_password', {
            p_user_id: profile.id,
            p_new_password: new_password
        })

        if (updateError) {
            console.error('Failed to reset password via RPC:', updateError.message)
            return NextResponse.json({ error: 'Gagal mereset password: ' + updateError.message }, { status: 500 })
        }

        // 4. Hapus kode verifikasi agar tidak bisa digunakan lagi
        await supabase
            .from('verification_codes')
            .delete()
            .eq('email', email.trim())

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Reset password endpoint error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}
