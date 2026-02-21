const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

function getFullUrl(url: string, params?: Record<string, any>): string {
    if (url.startsWith('/')) {
        url = url.substring(1)
    }
    const queryString = params ? new URLSearchParams(params).toString() : ''
    return `${BACKEND_URL}/${url}${queryString ? '?' + queryString : ''}`
}

export async function request(url: string, params: Record<string, any> = {}) {
    const fullUrl = getFullUrl(url, params)

    try {
        const response = await fetch(fullUrl)

        if (!response.ok) {
            const error = await response.json()
            return { data: null, error }
        }

        const data = await response.json()
        return { data, error: null }
    } catch (err) {
        if (err instanceof Error) {
            return { data: null, error: err.message }
        } else {
            return { data: null, error: 'An unknown error occurred.' }
        }
    }
}

export async function apiPost(url: string, body: any = {}) {
    const fullUrl = getFullUrl(url)

    try {
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const error = await response.json()
            return { data: null, error }
        }

        const data = await response.json()
        return { data, error: null }
    } catch (err) {
        if (err instanceof Error) {
            return { data: null, error: err.message }
        } else {
            return { data: null, error: 'An unknown error occurred.' }
        }
    }
}

export async function apiPut(url: string, body: any = {}) {
    const fullUrl = getFullUrl(url)

    try {
        const response = await fetch(fullUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const error = await response.json()
            return { data: null, error }
        }

        const data = await response.json()
        return { data, error: null }
    } catch (err) {
        if (err instanceof Error) {
            return { data: null, error: err.message }
        } else {
            return { data: null, error: 'An unknown error occurred.' }
        }
    }
}

export async function apiDelete(url: string) {
    const fullUrl = getFullUrl(url)

    try {
        const response = await fetch(fullUrl, {
            method: 'DELETE',
        })

        if (!response.ok) {
            const error = await response.json()
            return { data: null, error }
        }

        const data = await response.json()
        return { data, error: null }
    } catch (err) {
        if (err instanceof Error) {
            return { data: null, error: err.message }
        } else {
            return { data: null, error: 'An unknown error occurred.' }
        }
    }
}
