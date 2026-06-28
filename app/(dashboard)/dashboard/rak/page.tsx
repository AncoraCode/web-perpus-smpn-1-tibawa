import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import { createClient } from '@/utils/supabase/server'
import RakClient from './RakClient'

async function getRakData() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('rak')
            .select('*')
            .order('kode_rak', { ascending: true })

        if (error) {
            console.error('Error fetching rak:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error in getRakData:', error)
        return []
    }
}

export default async function RakPage() {
    const user = await getUserFromCookie()

    if (!user) redirect('/login')

    // Admin & Pengelola bisa akses
    if (!['admin', 'pengelola'].includes(user.role)) redirect('/dashboard')

    const rakData = await getRakData()

    return <RakClient rakData={rakData} user={user} />
}