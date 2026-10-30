# Access to the account

## Why

The buyer approves access to their own account through Composio. Their project API key belongs in the local key page, never in chat. Account access improves context while the buyer starts their formats; a missing key or pending approval never locks Home.

## Reuse what exists

Read doctor's key and connection checks before asking anything. With a working key and connection, continue quietly. If doctor reports a key elsewhere on the machine, tell the buyer where it found the setup and open the local key page. Do not read the secret out or copy it through chat.

## The key page

The agent runs `node scripts/keys/server.mjs`. The person opens the Composio dashboard, chooses their workspace and project, opens **API Keys**, creates a project key and pastes it on the local page. The page saves `.env.local`. The agent owns the command; the person owns copying their secret into the private field.

The dashboard address follows `https://dashboard.composio.dev/<workspace>/<project>/api-keys`. Both names vary per buyer. Link to `https://dashboard.composio.dev` when the current project URL is unknown; do not hardcode another buyer's workspace or add two more onboarding fields just to build a URL. API Keys is available in the project sidebar, and also under project settings. Use the project key, not the separate consumer connection key.

Source: [Composio dashboard navigation](https://docs.composio.dev/kb/guide/dashboard-navigation-overview).

## Connect and identify

Reuse the Instagram handle or profile link already supplied. Pass it to `node scripts/profile.mjs --handle <handle-or-link>`. The reader checks the authenticated account before saving posts. When several Composio connections exist, supplemental profile fields and media requests must use the same verified account.

The script opens any required approval link. The person signs in and approves there when ready. A retry belongs to the account task; Home and formats remain accessible. Instagram currently requires a Business or Creator account. Explain that requirement only when it applies and let the person decide about changing their account type. Do not promise a switch has no visible consequences.

Name, handle, bio, link, followers and the creator's photo come from the connected account. The photo is downloaded once per profile refresh and served from the local folder. A missing photo uses the existing cached image or initials. Never ask for an avatar upload when the connected account can supply it.

## Examples

A buyer supplies `https://www.instagram.com/yourname/`: show `@yourname` in the workspace and reuse the link for the reader. The buyer starts a format while account access is pending; approving it later resumes the account task. A buyer already connected sees their saved picture immediately, then refreshed data as the reader writes it.

## Counter-examples

Sending every buyer to one person's API Keys URL. Asking for a key in chat. Asking the buyer to run commands. Waiting for account analysis before showing Home. Importing whichever Instagram connection happens to appear first. Reporting a failed approval as an account with no posts.
