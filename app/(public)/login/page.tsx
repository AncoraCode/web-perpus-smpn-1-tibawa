import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import LoginClient from './LoginClient'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
    const user = await getUserFromCookie()

    if (user) {
        redirect('/dashboard')
    }

    return <LoginClient />
}