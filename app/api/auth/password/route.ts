import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUserFromCookie } from '@/utils/get-user'

// PUT /api/auth/password
export async function PUT(request: NextRequest) {
    try {
        const user = await getUserFromCookie()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { user_id, old_password, new_password } = await request.json()

        if (!old_password || !new_password) {
            return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })
        }
        if (new_password.length < 6) {
            return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 })
        }
        if (user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()

        // 1. Verifikasi password lama — gunakan login_guru yang sudah ada di DB
        //    (sama persis dengan flow login)
        const { data: verifyData, error: verifyError } = await supabase
            .rpc('login_guru', {
                p_username: user.username,
                p_password: old_password,
            })

        if (verifyError || !verifyData || verifyData.length === 0) {
            return NextResponse.json(
                { error: 'Password lama tidak sesuai' },
                { status: 400 }
            )
        }

        // 2. Update password baru — hash dengan pgcrypto langsung via raw SQL
        //    Gunakan supabase.rpc untuk panggil fungsi SQL yang kita buat
        const { error: updateError } = await supabase.rpc('update_user_password', {
            p_user_id:      user_id,
            p_new_password: new_password,
        })

        if (updateError) {
            return NextResponse.json(
                { error: 'Gagal mengubah password: ' + updateError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Password change error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}