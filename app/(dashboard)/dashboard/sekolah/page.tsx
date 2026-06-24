import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import { createClient } from '@/utils/supabase/server'
import SekolahClient from './SekolahClient'

export const dynamic = 'force-dynamic'

async function getSekolahData() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('detail_sekolah')
            .select('*')
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('Error fetching detail sekolah:', error)
            return null
        }

        return data || null
    } catch (error) {
        console.error('Error in getSekolahData:', error)
        return null
    }
}

export default async function SekolahPage() {
    const user = await getUserFromCookie()

    if (!user) redirect('/login')

    // Hanya admin yang bisa mengedit detail sekolah
    if (user.role !== 'admin') redirect('/dashboard')

    const sekolahData = await getSekolahData()

    return <SekolahClient initialData={sekolahData} user={user} />
}
