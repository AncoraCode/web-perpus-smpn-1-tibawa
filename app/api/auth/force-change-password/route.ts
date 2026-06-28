import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUserFromCookie } from '@/utils/get-user'

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromCookie()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { new_password } = await request.json()
        if (!new_password || new_password.length < 6) {
            return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
        }

        const supabase = await createClient()
        const { error } = await supabase.rpc('update_user_password', {
            p_user_id: user.id,
            p_new_password: new_password
        })

        if (error) {
            return NextResponse.json({ error: 'Gagal mengubah password: ' + error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Force change password error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
