// Rewrites absolute media URLs (e.g. http://localhost:5000/uploads/posters/x.jpg)
// into relative paths (/uploads/posters/x.jpg) in every JSON response, so images
// keep working regardless of the domain the app is served from (localhost, tunnel, etc).
const ABSOLUTE_UPLOADS_RE = /^https?:\/\/[^/\s]+(\/uploads\/)/i

function normalize(value) {
    if (typeof value === 'string') {
        return value.replace(ABSOLUTE_UPLOADS_RE, '$1')
    }
    if (Array.isArray(value)) {
        return value.map(normalize)
    }
    if (value && typeof value === 'object') {
        // Keep Date, Buffer, etc. untouched
        const proto = Object.getPrototypeOf(value)
        if (proto !== Object.prototype && proto !== null) return value
        const out = {}
        for (const key of Object.keys(value)) {
            out[key] = normalize(value[key])
        }
        return out
    }
    return value
}

export function relativeUploads(req, res, next) {
    const originalJson = res.json.bind(res)
    res.json = (body) => originalJson(normalize(body))
    next()
}

export { normalize as normalizeUploadUrls }

