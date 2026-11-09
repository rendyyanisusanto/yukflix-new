const BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiClient {
    getToken() {
        return localStorage.getItem('yukflix_auth_token')
    }

    setToken(token) {
        if (token) {
            localStorage.setItem('yukflix_auth_token', token)
        } else {
            localStorage.removeItem('yukflix_auth_token')
        }
    }

    clearToken() {
        localStorage.removeItem('yukflix_auth_token')
    }

    async request(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
        
        const headers = {
            ...(options.headers || {})
        }

        // Only add Content-Type: application/json if not uploading FormData
        if (!(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json'
        }

        const token = this.getToken()
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            })

            const json = await response.json().catch(() => null)

            if (!response.ok) {
                const errorMessage = json?.message || `Request failed with status ${response.status}`
                return {
                    data: null,
                    error: new Error(errorMessage),
                    status: response.status
                }
            }

            return {
                data: json?.data !== undefined ? json.data : json,
                error: null,
                status: response.status
            }
        } catch (error) {
            console.error(`API Error [${options.method || 'GET'} ${url}]:`, error)
            return {
                data: null,
                error,
                status: 0
            }
        }
    }

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' })
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body)
        })
    }

    put(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body)
        })
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' })
    }

    async upload(file, folder = 'media') {
        const formData = new FormData()
        formData.append('file', file)
        return this.post(`/upload?folder=${encodeURIComponent(folder)}`, formData)
    }
}

export const apiClient = new ApiClient()
export default apiClient

