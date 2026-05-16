import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUserFromCookie } from '@/utils/get-user'

export async function PUT(request: NextRequest) {
    try {
        const user = await getUserFromCookie()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { nama_lengkap, email, telepon, foto_url } = body

        if (!nama_lengkap?.trim())
            return NextResponse.json({ error: 'Nama lengkap wajib diisi' }, { status: 400 })

        const supabase = await createClient()

        // Build update payload — foto_url opsional
        const updateData: any = {
            nama_lengkap: nama_lengkap.trim(),
            email:        email?.trim()   || null,
            telepon:      telepon?.trim() || null,
        }
        // Hanya update foto_url jika dikirim (bisa null untuk hapus)
        if ('foto_url' in body) {
            updateData.foto_url = foto_url ?? null
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Refresh cookie session
        const updatedUser = {
            ...user,
            nama_lengkap: data.nama_lengkap,
            email:        data.email,
            telepon:      data.telepon,
            foto_url:     data.foto_url,
        }

        const response = NextResponse.json({ success: true })
        response.cookies.set('user_session', JSON.stringify(updatedUser), {
            httpOnly: true,
            secure:   process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge:   60 * 60 * 24 * 7,
            path:     '/',
        })

        return response
    } catch (error: any) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}