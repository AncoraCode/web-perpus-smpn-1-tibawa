import { cookies } from 'next/headers'

export async function getUserFromCookie() {
    try {
        const cookieStore = await cookies()
        const userSession = cookieStore.get('user_session')

        if (!userSession) {
            return null
        }

        const user = JSON.parse(userSession.value)
        return user

    } catch (error) {
        console.error('Error getting user from cookie:', error)
        return null
    }
}

// .
