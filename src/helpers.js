export { getSessionToken, verifySessionToken, getCookieFromHeader }

async function getSessionToken(accessToken, expiresIn, secret) {
	const token = await sign({ accessToken }, secret, { expiresIn })
	return token
}

async function verifySessionToken(sessionToken, secret) {
	try {
		const payload = await verify(sessionToken, secret)
		return payload
	} catch (err) {
		console.error(err)
		return null
	}
}

function base64UrlEncode(arrayBuffer) {
	let base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
	return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

function base64UrlDecode(str) {
	str = str.replace(/-/g, "+").replace(/_/g, "/")
	let binary = atob(str)
	let bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i)
	}
	return bytes.buffer
}

async function hmacSHA256(key, msg) {
	const enc = new TextEncoder()
	const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
	return crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg))
}

async function sign(payload, secret, options = {}) {
	const header = { alg: "HS256", typ: "JWT", ...options.header }

	const iat = Math.floor(Date.now() / 1000)
	if (!payload.iat) payload.iat = iat
	if (options.expiresIn) payload.exp = iat + options.expiresIn

	const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)))
	const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)))

	const signatureArrayBuffer = await hmacSHA256(secret, `${encodedHeader}.${encodedPayload}`)
	const signature = base64UrlEncode(signatureArrayBuffer)

	return `${encodedHeader}.${encodedPayload}.${signature}`
}

async function verify(token, secret) {
	const [encodedHeader, encodedPayload, signature] = token.split(".")
	if (!encodedHeader || !encodedPayload || !signature) throw new Error("Invalid token")

	const expectedArrayBuffer = await hmacSHA256(secret, `${encodedHeader}.${encodedPayload}`)
	const expectedSignature = base64UrlEncode(expectedArrayBuffer)

	if (signature !== expectedSignature) throw new Error("Invalid signature")

	const payloadStr = new TextDecoder().decode(base64UrlDecode(encodedPayload))
	const payload = JSON.parse(payloadStr)

	const now = Math.floor(Date.now() / 1000)
	if (payload.exp && now > payload.exp) throw new Error("Token expired")

	return payload
}

function getCookieFromHeader(cookieHeader, name) {
	if (!cookieHeader) return null
	const cookies = cookieHeader.split(";").map((c) => c.trim())
	for (const c of cookies) {
		const [key, ...val] = c.split("=")
		if (key == name) return val.join("=")
	}
	return null
}
