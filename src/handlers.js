import { getCookieFromHeader, getSessionToken, verifySessionToken } from "./helpers"
import { runAI } from "./ai_functions"

export { handleIndex, handlePrompt }

/**
 * Index page handler
 * @param {*} request
 * @param {*} env
 * @returns html for the homepage. If an auth code is included as a query parameter, exchange for gmail access token and set a session cookie
 */
async function handleIndex(request, env) {
	const url = new URL(request.url)
	const code = url.searchParams.get("code")
	const html = (await env.ASSETS.fetch(new URL("static_index.html", url))).body

	if (code == null) {
		return new Response(html)
	}

	const params = new URLSearchParams({
		code,
		client_id: "316406263891-m2apfpg48uesj5cob12vdrfl8h4t81qm.apps.googleusercontent.com",
		client_secret: env.OAUTH_CLIENT_SECRET,
		redirect_uri: "http://127.0.0.1:8787",
		grant_type: "authorization_code",
	})

	const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: params.toString(),
	})

	const tokenData = await tokenRes.json()
	const accessToken = tokenData.access_token
	const expiresAt = Date.now() + tokenData.expires_in * 1000
	const sessionToken = await getSessionToken(accessToken, expiresAt, env.JWT_SECRET)

	const headers = new Headers({
		"Content-Type": "text/html; charset=UTF-8",
		//'Set-Cookie': `sessionToken=${sessionToken}; HttpOnly; Secure; Path=/; Max-Age=${tokenData.expires_in}`,
		"Set-Cookie": `sessionToken=${sessionToken}; Path=/; Max-Age=${tokenData.expires_in}`,
	})

	return new Response(html, { status: 200, headers })
}

/**
 * Handler for ai prompts
 * @param {*} request
 * @param {*} env
 * @returns AI's output response, with possible side effects to the user's gmail inbox.
 */
async function handlePrompt(request, env) {
	const sessionToken = getCookieFromHeader(request.headers.get("cookie"), "sessionToken")
	if (sessionToken == null) {
		return new Response(JSON.stringify({ response: "User has not logged in." }))
	}
	const payload = await verifySessionToken(sessionToken, env.JWT_SECRET)
	if (payload.accessToken == null) {
		return new Response(JSON.stringify({ response: "Failed to get email access permissions" }))
	}

	const { prompt } = await request.json()
	//console.log(prompt);
	return new Response(JSON.stringify(await runAI(prompt, payload.accessToken, env)))
}
