import { createClient } from '@/utils/supabase/server'
import { PostgrestError } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json()

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username dan password harus diisi' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        let targetUsername = username.trim()

        // Cek apakah input username adalah NIP (jika ada user dengan NIP tersebut)
        const { data: profileByNip } = await supabase
            .from('profiles')
            .select('username')
            .eq('nip', targetUsername)
            .maybeSingle()

        if (profileByNip) {
            targetUsername = profileByNip.username
        }

        // Login menggunakan function login_guru
        const { data, error } = await supabase
            .rpc('login_guru', {
                p_username: targetUsername,
                p_password: password
            })
            .single() as { data: any, error: PostgrestError }

        if (error || !data) {
            console.error('Login error:', error?.message)
            return NextResponse.json(
                { error: 'Username atau password salah' },
                { status: 401 }
            )
        }

        // Ambil data foto_url dan nip terbaru dari profiles
        const { data: profileData } = await supabase
            .from('profiles')
            .select('foto_url, nip')
            .eq('id', data.user_id)
            .maybeSingle()

        const userPayload = {
            id:           data.user_id,
            username:     data.username,
            nama_lengkap: data.nama_lengkap,
            email:        data.email,
            role:         data.role,
            foto_url:     profileData?.foto_url || data.foto_url || null,
            nip:          profileData?.nip || null,
        }

        // Buat response dengan cookie
        const response = NextResponse.json({
            success: true,
            message: 'Login berhasil',
            user: userPayload,
        })

        // Set cookie untuk session
        response.cookies.set('user_session', JSON.stringify(userPayload), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 hari
            path: '/',
        })

        return response

    } catch (error: any) {
        console.error('Auth API error:', error?.message)
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const userSession = request.cookies.get('user_session')

        if (!userSession) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            )
        }

        const user = JSON.parse(userSession.value)

        return NextResponse.json({
            authenticated: true,
            user: user,
        })

    } catch (error: any) {
        console.error('Get session error:', error?.message)
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    try {
        const response = NextResponse.json({
            success: true,
            message: 'Logout berhasil',
        })

        // Hapus cookie
        response.cookies.delete('user_session')

        return response

    } catch (error: any) {
        console.error('Logout error:', error?.message)
        return NextResponse.json(
            { error: 'Gagal logout' },
            { status: 500 }
        )
    }
}