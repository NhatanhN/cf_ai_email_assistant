I made this to submit to a job application. It asked for the prompts I used to be in this file. I don't have all of them (since I may have deleted some conversations), but this should be most of them:

```
Can you help me fill out this project spec? It's going to rely on cloudflare's agents services:
Description The goal of this piece of software is to enable an AI to access email behavior
(e.g. reading/deleting emails, marking them as read, etc.) so that it can perform them on
the user’s behalf.

Daily inbox summary
Summarizes yesterday’s emails
  Incl. reminders respond to any ongoing correspondence.
Organize emails
  Summarizes all of your unread emails, and may mark them as read. Identify low-importance
  emails, ask user for permission to archive/delete them. Identify and block emails that
  consistently send low-value emails (e.g. follow-people-you-may-know emails).
Other intelligent behavior an AI might be able to carry out.

Planning (to be filled out)
```

```
I have these steps so far: Steps:
1. Set up cloudflare environment.
2. Integrate email APIs with cloudflare AI workers
3. Implement summary
4. Implement organization
5. Implement support for AI personalization/improvement over time.

Can you fill out tasks for these ?
```

```
Can you give me an example of how something like cloud flare's ai agent could invoke a behavior
or function
```

```
How do I hook up these functions to the AI to let it invoke them?
```

```
Can you give a complete example of where a worker calls the function "function1" based on a
user prompt of some kind?
```

```
How do I get the cookies/header from a request in cloudflare workers?
```

```
How to check cookies in javascript
```

```
How to access an change the attributes of a tag in html (e.g. disabled)?
```

```
How do I set up a js linter that would do stuff like change strings declared with single quotes to
double, or remove semi colons (e.g. with prettier or something)?
```

```
What css rule could I use to make it so that a disabled button does not have its border changed when
hover overed or clicked on?
```

```
How do I get the input text of a textarea element?
```

```
In a cloudflare workers environment, I have this line:
return new Response(env.ASSETS.fetch(new URL("static_index.html", url)), { status: 200, headers })

In the browser, however, I get only [Object Promise]
```

```
Why can I return this:
return env.ASSETS.fetch(new URL("static_index.html", url))

But not this:
return new Response(env.ASSETS.fetch(new URL("static_index.html", url)), { status: 200, headers }) ?
```

```
I added the await statement but now get: [object Response]
```

```
How do I check what cookies I have in the browser?
```

```
I'm getting an oauth2 token this way:
<omitted>

But I'm getting back a response that says unsupported grant type
```

```
The next issue is that I'm getting back a response "bad request" with error "invalid grant"
```

```
I set a cookie with max-age equal to this value:
const expiresAt = Date.now() + tokenData.expires_in * 1000
But for some reason, it seems a lot higher than expected? (>1 year rather than expected ~ 1 hour)
```

```
Where can I find the documentation for the .run() method for the AI binding?
```

```
Options in cloudflare for storing something like a message history for an AI chat?
```

```
How do I use cloudflare workers AI to access and manipulate my emails?
```

```
How can I:
- From the server, return a response and change parts of the url (in particular removing query paramters)
- From the browser, check to see if there's query parameters and if so, clear them
```

```
What if my server is running on a v8 runtime (so I'm returning stuff like response objects)?
```

```
What does this typescript mean?
export type AiTextGenerationToolInputWithFunction =
  AiTextGenerationToolInput["function"]
  & { function?: (args: any) => Promise<string>; };
```

```
Combine types in this manner would be more like union wouldn't it?
```

```
But practically, it's like the union of their properties, right? Like, taking all the properties
from the left operand and all from the right operand and merging them into one object that has both
```

```
Can you give me an example of setting up a cloudflare AI with tool or method calling?
```

```
Can you explain this type definition?:

<type definition for AiTextGenerationToolInput omitted>
```

```
The type's don't have to be strictly defined do they? For instance, I could put something like
list[number] or list<number> or list[email_ids]?
```

```
What if my method signature looked like: const modify = async (id, addLabelIds = [], removeLabelIds = [])?
```

```
How do I include the function handler for this embedded tool in this json?
```

```
I believe in through looking in the source code that embedding the function code in the tools is legacy,
and that to embed the functions in the json, it goes in a functions: [{name: string, code: string}] value.
What do I put as the name and code values?

(yikes I don't even know what I was thinking when I asked these lines of questions)
```

```
Can you generate the tool json for get, list, and trash?
```

```
Is this right?
get.toString()
.replace("authHeader", authHeader)
.replace("${MAIL_ENDPOINT}", MAIL_ENDPOINT)

Where authHeader and MAIL_ENDPOINT are defined
```

```
What about
get.toString().replace("%1", authHeader)
.replace("%2", MAIL_ENDPOINT)?

I need to insert the literal value since those variable names might not be known during runtime
```

```
Can you give me an example of using gmail's rest api to mark an email as read?
```

```
I can't get my cloudflare worker AI to invoke any tool calls. It has access to several, name "get", "list",
"modify", and "trash", which all are able to modify the user's email inbox. I gave it the system prompt "You
are an email assistant. You have access to the user's email through tool calls. Try to manipulate the user's
inbox to best match their intent.". And when prompted with "Can you get my last email?", I get the response
"I'm sorry, but I am not able to access your email account.".
```

```
It made up a fake email response. I still don't see anything inside the tool_calls array.
```

```
I still can't get it to invoke any functions (the tool_calls array is still empty).

I gave it the system prompt:
You are an email assistant. You have access to the user's email through tools: get, list, modify, and trash.
Always use these tools to access or modify emails. Do not make up email contents. If the user asks for emails,
pick the appropriate tool and call it.

And it responds with something like I'm calling the "get" tool to retrieve your last email. Getting email...
```

```
Can you give an example of using curl to use a gmail rest api endpoint (e.g. to retrieve the contents of
an email)?
```

```
For the get message endpoint, what does specifying raw vs full format do?
```

```
Can you give me regex for match http/s links? e.g. https://example.com
```

```
What does \b do in regex?
```

```
Can a payload have both the body and parts field populated?
```

```
Assuming that an email has its email text data (not the metadata or anything like that)
inside the body field, would it also be possible for it to have values in its parts field?
```

```
How do you base64 decode something in javascript v8?
```

```
Can you write some code for me that replaces multiple sequences of line breaks with just two
linebreaks? (e.g. \r\n)
```

```
When I'm decoding my responses with base64, it seems to be doing it slightly improperly. For
instance, this is a part of the decoded message:

Still, itâs worth being skeptical any time a company publishes research

It has an a-hat character (or whatever its name is) in place where there should be an apostrophe '.
```

```
I see this header in the message I'm decoding: charset=utf-8. Does atob decode utf-8?
```

```
What are roles in AI prompt (e.g. user, system)?
```

```
Say the AI sometimes makes a mistake in the JSON formatting, how will I know whether that means the
AI is giving a response or that the AI wanted to invoke a function and I need to tell it to retry?
```

```
Can I tell the AI to use the function_call field? I'm using cloudflare's workers AI, and it doesn't
seem to make use of any tool calls, but I can get it to return json in its response that I can use to
make a tool call programmatically.
```

```
How do I list the fields of an object?
```

```
Okay, what I'm seeing here is that: When the ai response is plain text, normal response, the type is
string. When the ai response is json however, like for an invocation, then the ai response is of type
object (even though its tsx definition says that it should be of type string?)?
```
