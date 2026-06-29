import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import { createClient } from '@/utils/supabase/server'
import UsersClient from './UsersClient'

async function getUsersData() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, nama_lengkap, email, telepon, role, foto_url, created_at, updated_at, nip')
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching users:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error in getUsersData:', error)
        return []
    }
}

export default async function UsersPage() {
    const user = await getUserFromCookie()
    if (!user) redirect('/login')
    if (user.role !== 'admin') redirect('/dashboard')

    const usersData = await getUsersData()

    return <UsersClient usersData={usersData} currentUser={user} />
}