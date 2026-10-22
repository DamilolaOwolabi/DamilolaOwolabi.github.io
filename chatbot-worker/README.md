# Site AI assistant: setup

The chat bubble on damilolaowolabi.github.io talks to a small **Cloudflare Worker** (`worker.js`, this folder). The Worker keeps your Anthropic API key secret, adds what the site knows about you (`/chatbot/knowledge.txt`, generated on every build), and asks Claude for an answer.

```
Visitor's browser ──► Cloudflare Worker (holds the API key) ──► Claude API
                              │
                              └── reads https://damilolaowolabi.github.io/chatbot/knowledge.txt
```

You need two free accounts: **Anthropic** (for the API key) and **Cloudflare** (you already have one from Web Analytics). Setup takes about 10 minutes.

## 1. Get an Anthropic API key

1. Go to https://console.anthropic.com and sign in (or sign up).
2. **Billing:** add a small amount of prepaid credit. The assistant uses Claude Haiku, the fastest and least expensive model. Each answer costs roughly a tenth of a cent, so a few dollars covers thousands of questions.
3. **Limits:** set a low monthly spend limit (for example $5) so costs can never surprise you.
4. **API keys → Create key.** Name it `website-chat`, then copy the key (it starts with `sk-ant-`). You'll only see it once.

## 2. Create the Worker (in the browser, no installs)

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
2. Name it `dammy-chat` → **Deploy** (this deploys a placeholder).
3. Click **Edit code**. Delete everything in the editor, paste the full contents of [`worker.js`](worker.js), and click **Deploy**.
4. Go back to the Worker → **Settings** → **Variables and Secrets** → **Add**:
   - Type: **Secret**
   - Variable name: `ANTHROPIC_API_KEY`
   - Value: the key from step 1

   Click **Deploy** (or **Save**).

5. Copy the Worker's address. It looks like `https://dammy-chat.<your-name>.workers.dev`.
6. Open that address in your browser. You should see `"configured":true`.

## 3. Turn on the chat bubble

Put the Worker address in `_config.yml`:

```yaml
chatbot:
  endpoint: https://dammy-chat.<your-name>.workers.dev
```

(Or send the address to Claude and it will do this for you.) The site rebuilds automatically, and the chat bubble appears on every page.

## Changing what the assistant knows

- **Most facts come from the site itself:** home page, CV, projects, publications. Update those as usual, and the assistant picks up the changes within about 10 minutes of the site redeploying.
- **Facts that aren't on the site** (roles you're open to, location preference, topics to send to you directly) live in `_data/chatbot.yml`. Edit them in Pages CMS under **AI assistant**.
- **How it behaves** (tone, what it refuses, length of answers) is in the `RULES` text near the top of `worker.js`. After editing it, paste the new file into the Cloudflare editor again and click **Deploy**.

## Safety and cost controls built in

- Only your website can use the Worker from a browser. Requests from other sites are refused. (Scripts can fake where they come from, so also set an Anthropic spend limit and the rate limit below.)
- Every reply is signed. Earlier replies sent back without a valid signature are ignored, so visitors can't plant fake assistant lines to steer it.
- Each visitor is limited to about 25 messages per 10 minutes. Long messages and long conversations are trimmed.
- Answers are capped at about 700 tokens (a few paragraphs).
- The assistant answers only about you, uses only facts from your site, refers salary, start date, visa and scheduling questions to your email, and won't share client names, your phone number, or your address.
- Nothing is stored by the site or the Worker. Conversations live only in the visitor's browser tab.

Optional, for a firmer rate limit: in the Worker's **Settings → Bindings**, add a **Rate limiting** binding named `RATE_LIMITER` (for example 20 requests per 60 seconds). The Worker uses it automatically when it exists.

## Optional settings (Worker → Settings → Variables and Secrets, type Text)

| Name              | Default                                                   | What it does                                                                                         |
| ----------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `ALLOWED_ORIGINS` | `https://damilolaowolabi.github.io`                       | Sites allowed to use the assistant. Add `,http://localhost:4000` only while testing on your computer |
| `MODEL`           | `claude-haiku-5-5`                                        | Claude model                                                                                         |
| `KNOWLEDGE_URL`   | `https://damilolaowolabi.github.io/chatbot/knowledge.txt` | Where the assistant reads its facts                                                                  |

## Deploying from your computer instead (optional)

If you prefer the command line: install Node.js, then run these in this folder.

```powershell
npm install -g wrangler
wrangler login
wrangler deploy
wrangler secret put ANTHROPIC_API_KEY
```

`wrangler.toml` in this folder is already set up.

## If the bubble says it can't reach the assistant

- Open the Worker address in a browser. `"configured":false` means the secret isn't set (step 2.4).
- In Cloudflare, open the Worker → **Logs** to see errors. An "Anthropic API error" usually means the key is wrong or the account is out of credit.
- Check that `chatbot.endpoint` in `_config.yml` exactly matches the Worker address and starts with `https://`.
