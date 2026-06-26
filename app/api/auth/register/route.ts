import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUserFromCookie } from '@/utils/get-user'

export async function POST(request: NextRequest) {
    try {
        // Hanya admin yang boleh
        const currentUser = await getUserFromCookie()
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { username, nama_lengkap, email, telepon, password } = await request.json()

        // Validasi
        if (!username?.trim()) return NextResponse.json({ error: 'Username wajib diisi' }, { status: 400 })
        if (!nama_lengkap?.trim()) return NextResponse.json({ error: 'Nama lengkap wajib diisi' }, { status: 400 })
        if (!email?.trim()) return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
        if (!password) return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 })
        if (password.length < 6) return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })

        const supabase = await createClient()

        // Cek username sudah ada
        const { data: existingUsername } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username.trim())
            .single()

        if (existingUsername) {
            return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
        }

        // Cek email sudah ada
        const { data: existingEmail } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.trim())
            .single()

        if (existingEmail) {
            return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })
        }

        // Insert user baru dengan password ter-hash via pgcrypto
        // Gunakan RPC agar crypt() bisa dipanggil di server
        const { data, error } = await supabase.rpc('register_user', {
            p_username: username.trim(),
            p_nama_lengkap: nama_lengkap.trim(),
            p_email: email.trim(),
            p_telepon: telepon || null,
            p_password: password,
            p_role: 'pengelola',
        })

        if (error) {
            return NextResponse.json(
                { error: error.message.includes('unique') ? 'Username atau email sudah digunakan' : error.message },
                { status: 500 }
            )
        }

        // Fetch data user yang baru dibuat
        const { data: newUser, error: fetchError } = await supabase
            .from('profiles')
            .select('id, username, nama_lengkap, email, telepon, role, foto_url, created_at, updated_at')
            .eq('username', username.trim())
            .single()

        if (fetchError || !newUser) {
            return NextResponse.json({ error: 'User dibuat tapi gagal fetch data' }, { status: 500 })
        }

        return NextResponse.json({ success: true, user: newUser })

    } catch (error: any) {
        console.error('Register error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}