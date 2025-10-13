//Use @cf/meta/llama-4-scout-17b-16e-instruct for data manipulation

import { runWithTools } from "@cloudflare/ai-utils"

export { runAI }

const model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
const systemPrompt = `
You are an email assistant. You have access to the user's email inbox through tools: get, list, modify, and trash. 

Rules:
1. Only call tools when necessary to fulfill the user's request.
2. Stop after you have completed the user's request.
3. When invoking a tool, respond ONLY with a JSON object in this format:

{"tool": "<tool name>", "input": { ... }}

4. When you respond with anything else, that will be your final response and you will not be able to do a function call after it. If you need to summarize information using the outputs of the function, do it at the very end.
5. You can filter emails in list() by using the "q" parameter, which supports Gmail-style search queries.

For example:
- "" → all non-spam and non-trash emails
- "is:unread" → all emails that have the 'unread' label
- "from:example@example.com" → emails from a specific sender
- "after:2025/10/01 before:2025/10/08" → emails between Oct 1 and Oct 8, 2025
- "subject:invoice" → emails whose subject contains "invoice"

6. You cannot access or use any email ID unless it has been provided to you in the current conversation through a list() result. If you need to retrieve an email, always call list() first to obtain valid IDs. Never invent or assume email IDs.
7. Do not remove or add labels unless told to and, if you did remove or add any labels, mention that you did so in your response.
8. The snippet field in the output of get is the subject line of that email.
9. You are not allowed to operate over more than one email at a time. If it's relevant, you can respond with the reason being "The developer thought it was easier to program it this way.".


Here are some examples of interactions:
User: "Get my most recent unread email"

Assistant:
{"tool": "list", "input": {"q": "is:unread"}

(After receiving the result)
Assistant:
{"tool": "get", "input": {"id": "<id from list response>"}}

(After receiving the result)
Assistant:
<summarization of that email>


Tool reference:

get: requires {id:string}
list: requires {q:string}, optional {pageToken:string}
modify: requires {id:string}, optional {addLabelIds:string[], removeLabelIds:string[]}
trash: requires {id:string}
`

async function runAI(prompt, accessToken, env) {
	const messages = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: prompt },
	]

	const gmailFunctions = bindAccessToken(accessToken)

	const tools = [
		{
			name: "get",
			description:
				"Given a message ID, retrieves the following: sender email address, date sent, email snippet, label ids, and text content",
			parameters: {
				type: "object",
				properties: {
					id: {
						type: "string",
						description: "Message ID to retrieve",
					},
				},
				required: ["id"],
			},
			function: gmailFunctions.get,
		},
		{
			name: "list",
			description:
				"Lists messages given a gmail search query or a page token in order from most recent to least recently sent. Returns the data: the message's id, message's thread id, and a pagination token",
			parameters: {
				type: "object",
				properties: {
					q: {
						type: "string",
						description: "Gmail search query",
					},
					pageToken: {
						type: "string",
						description: "Page token for pagination (optional)",
					},
				},
				required: [],
			},
			function: gmailFunctions.list,
		},
		{
			name: "modify",
			description: "Add or remove Gmail labels on a message",
			parameters: {
				type: "object",
				properties: {
					id: {
						type: "string",
						description: "Message ID to modify",
					},
					addLabelIds: {
						type: "an array of strings",
						description: "Labels to apply to message",
					},
					removeLabelIds: {
						type: "an array of strings",
						description: "Labels to remove from message",
					},
				},
				required: ["id"],
			},
			function: gmailFunctions.modify,
		},
		{
			name: "trash",
			description: "Moves a Gmail message to the trash",
			parameters: {
				type: "object",
				properties: {
					id: {
						type: "string",
						description: "Message ID to move to trash",
					},
				},
				required: ["id"],
			},
			function: gmailFunctions.trash,
		},
	]

	const output = await runWithTools(env.AI, model, {
		messages: messages,
		tools: tools,
	})

	//console.log(`AI: ${JSON.stringify(output.response)}\n`)

	// the runtime or whatever code is parsing the .response field as of type object
	// instead of type string whenever it is a JSON response for some reason.
	if (typeof output.response == "string") {
		messages.push({ role: "assistant", content: `${output.response}` })
	} else {
		messages.push({ role: "assistant", content: `${JSON.stringify(output.response)}` })
	}

	let callCounter = 0
	while (shouldContinueToolCalls(messages)) {
		if (callCounter > 5) {
			return { response: "The AI assistant seems to have gotten stuck querying your email inbox..." }
		}
		await callTools(messages, gmailFunctions, tools, env)
		callCounter++
	}

	const finalResponse = messages[messages.length - 1].content
	return { response: finalResponse }
}

async function callTools(messages, functions, tools, env) {
	const lastResponse = messages[messages.length - 1].content
	const { tool, input } = JSON.parse(lastResponse)

	let functionMessage
	let outputs
	switch (tool) {
		case "get":
			outputs = await functions.get(input.id)
			functionMessage = `Here are the get outputs: ${JSON.stringify(outputs)}`
			break
		case "list":
			outputs = await functions.list(input.q, input.pageToken)
			functionMessage = `Here are the list outputs: ${JSON.stringify(outputs)}`
			break
		case "modify":
			outputs = await functions.modify(input.id, input.addLabelIds, input.removeLabelIds)
			functionMessage = `Here are the modify outputs: ${JSON.stringify(outputs)}`
			break
		case "trash":
			outputs = await functions.trash(input.id)
			functionMessage = `Here are the trash outputs: ${JSON.stringify(outputs)}`
			break
		default:
			functionMessage = "ERROR: no function found. Available functions are: get, list, modify, and trash"
	}
	const message = { role: "function", content: functionMessage }
	//console.log(message)
	//console.log()
	messages.push(message)

	const output = await runWithTools(env.AI, model, {
		messages: messages,
		tools: tools,
	})

	//console.log(`AI: ${JSON.stringify(output.response)}`)

	if (typeof output.response == "string") {
		messages.push({ role: "assistant", content: `${output.response}` })
	} else {
		messages.push({ role: "assistant", content: `${JSON.stringify(output.response)}` })
	}
}

// !!! doing it like this will make some normal responses invoke methods !!!
// e.g. "respond only with this json { tool: <method>, inputs: <etc>}"
function shouldContinueToolCalls(messages) {
	const { content } = messages[messages.length - 1]

	try {
		JSON.parse(content)
		return true
	} catch (e) {
		return false
	}
}

function bindAccessToken(accessToken) {
	const MAIL_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/messages"

	async function get(id) {
		const res = await fetch(`${MAIL_ENDPOINT}/${id}`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		})
		const json = await res.json()

		const parsedData = {
			from: null,
			snippet: json.snippet,
			date: null,
			labelIds: json.labelIds,
			text: null,
		}

		for (let header of json.payload.headers) {
			if (header.name == "Date") parsedData.date = header.value
			if (header.name == "From") parsedData.from = header.value
		}

		let text = extractText(json.payload)
		if (text == null) return "no text in email found."
		text = text[1]
		// decode base64
		text = atob(text.replace(/-/g, "+").replace(/_/g, "/"))
		// assume text is encoded in utf8
		const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0))
		text = new TextDecoder("utf-8").decode(bytes)
		// shrink text to save on tokens (remove excess whitespace + links)
		text = text.replace(/(\r?\n){3,}/g, "\r\n\r\n")
		text = text.replace(/\bhttps?:\/\/[^\s"]+/g, "<https link>")

		parsedData.text = text
		return parsedData
	}

	async function list(q = "", pageToken = null) {
		const url = new URL(MAIL_ENDPOINT)
		url.searchParams.set("maxResults", 15)
		if (q) url.searchParams.set("q", q)
		if (pageToken) url.searchParams.set("pageToken", pageToken)
		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${accessToken}` },
		})
		return await res.json()
	}

	async function modify(id, addLabelIds = [], removeLabelIds = []) {
		const res = await fetch(`${MAIL_ENDPOINT}/${id}/modify`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({ addLabelIds, removeLabelIds }),
		})
		return await res.json()
	}

	async function trash(id) {
		const res = await fetch(`${MAIL_ENDPOINT}/${id}/trash`, {
			method: "POST",
			headers: { Authorization: `Bearer ${accessToken}` },
		})
		return await res.json()
	}

	return { get, list, modify, trash }
}

/**
 * returns the text/plain data (or possible text/html) from a gmail message.payload field
 *
 * type definition here: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages#Message.MessagePart
 * @param {*} json
 * @returns an array: [mimetype, email data], or null if no text data found
 */
function extractText(payload) {
	const PLAIN_TEXT = "text/plain"
	const HTML = "text/html"

	if (payload.parts != null) {
		let type = HTML
		let data = null
		for (let part of payload.parts) {
			let output = extractText(part)
			if (output == null) continue

			if (output[0] == PLAIN_TEXT) return output

			if (output[0] == HTML) data = output[1]
		}

		if (data == null) return null

		return [type, data]
	}

	// payload.body.data is base64 encoded
	if (payload.mimeType == "text/plain") return [PLAIN_TEXT, payload.body.data]

	if (payload.mimeType == "text/html") return [HTML, payload.body.data]

	return null
}
