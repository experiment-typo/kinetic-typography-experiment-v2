# Deployment Guide — v2.0 Platform

This is the end-to-end setup: from the code on your computer to a working
experiment URL where data lands in a Google Sheet you control.

There are three connected pieces, working together:

```
   ┌──────────────┐  fetches HTML/JS    ┌───────────────────┐
   │  Participant │ ──────────────────► │   GitHub Pages    │
   │   browser    │                     │  (your platform)  │
   └──────┬───────┘                     └───────────────────┘
          │ POST results JSON
          ▼
   ┌──────────────────┐  writes rows    ┌──────────────────┐
   │  Google Apps     │ ──────────────► │   Google Sheet   │
   │  Script Web App  │                 │  (your results)  │
   └──────────────────┘                 └──────────────────┘
```

The participant visits your GitHub Pages URL, plays through the experiment,
and on submission the platform sends the results to the Apps Script Web App,
which writes them into a Google Sheet you own.

You will set this up in three stages, in order:

1. Create the Google Sheet and Apps Script Web App, then copy its URL
2. Paste the URL into the platform code, push to GitHub
3. Enable GitHub Pages and confirm the deployed URL works end-to-end

---

## Stage 1 — Google Sheet + Apps Script Web App

**1.1 Create the Sheet**

- Go to [sheets.google.com](https://sheets.google.com) and create a new
  blank spreadsheet
- Rename it something like `Kinetic Typography v2.0 — Results`
- Leave the sheet itself empty; the script will create tabs automatically
- **Important**: keep this Sheet separate from your v1.0 pilot data

**1.2 Open the Apps Script editor**

- In the Sheet, click `Extensions` → `Apps Script`
- A new editor tab opens with a placeholder `Code.gs` file
- Delete everything in that file
- Open `google_apps_script_v2.gs` from your code zip and paste its full
  contents into the editor
- Click the floppy-disk icon (or Ctrl-S) to save
- Give the script project a name when prompted, like `v2.0 endpoint`

**1.3 Deploy as a Web App**

- Click the blue `Deploy` button (top right) → `New deployment`
- Click the gear icon next to `Select type` → choose `Web app`
- Fill in:
  - **Description**: `v2.0 endpoint`
  - **Execute as**: `Me`
  - **Who has access**: `Anyone` (or `Everyone` — same option, the wording
    has changed across Google updates)
- Click `Deploy`
- Google will ask you to authorise the script. Click `Authorize access`,
  pick your account, and accept. You may see a "Google hasn't verified
  this app" warning — click `Advanced` → `Go to (your project name)
  (unsafe)` → `Allow`. This is normal for personal Apps Script projects.
- After deployment, copy the **Web app URL** shown. It looks like:
  `https://script.google.com/macros/s/AKfyc.../exec`
- **Save this URL somewhere** — you'll paste it into the code in Stage 2.

**1.4 Sanity check**

- Open the Web app URL in your browser. You should see:
  `{"ok":true,"message":"Kinetic Typography v2.0 endpoint is active. Use POST to submit data."}`
- If you see this, the endpoint is alive and ready to receive submissions.

> **Note about redeploys**: every time you click "New deployment" in Apps
> Script, Google generates a new URL. If you change the script later, prefer
> `Manage deployments` → edit the existing deployment → bump the version
> rather than creating a new one — that way the URL stays the same and you
> won't have to update the platform code.

---

## Stage 2 — Wire up the platform code

**2.1 Insert the URL**

- Open `src/logic/Questionnaire.js` in your editor
- Find this line (about 90 lines in):
  ```js
  const ENDPOINT_URL = 'https://script.google.com/macros/s/REPLACE_WITH_V2_ENDPOINT/exec';
  ```
- Replace the placeholder with the URL you copied in step 1.3
- Save the file

**2.2 Test locally**

Before pushing to GitHub, confirm the platform works on your machine:

```bash
cd kinetic_typography_v2
python3 -m http.server 8000
```

- Open `http://localhost:8000` in Chrome or Firefox
- Click through a complete session (sub-framework → consent → instructions
  → practice → 11 trials → questionnaire → submit)
- After submission, switch to your Google Sheet — you should see three new
  tabs (`Sessions`, `Trials`, `Questionnaire`) with one row of test data
- If the data appears, your endpoint is wired correctly. If not, check
  the browser console (F12) for errors.

---

## Stage 3 — Deploy to GitHub Pages

**3.1 Push to GitHub**

You already have a repo at
`https://github.com/experiment-typo/kinetic-typography-experiment`. Push the
v2.0 code to it. The cleanest way is:

```bash
# In the kinetic_typography_v2 directory:
git init
git add .
git commit -m "v2.0 platform"
git remote add origin https://github.com/experiment-typo/kinetic-typography-experiment.git
git push -u origin main --force
```

If you'd prefer to keep v1.0 history separately, push v2.0 to a new branch
called `v2` and use a branch deployment in step 3.2.

**3.2 Enable GitHub Pages**

- Go to your repo on github.com
- Click `Settings` → `Pages` (in the left sidebar)
- Under **Source**, select `Deploy from a branch`
- Choose the branch (`main` or `v2`) and the folder (`/` for root)
- Click `Save`
- GitHub will build the site. After 1-2 minutes, your URL appears at the
  top of the same Pages settings page, formatted like
  `https://experiment-typo.github.io/kinetic-typography-experiment/`

**3.3 Confirm everything works end-to-end**

- Open the deployed URL in an incognito browser window
- Run a complete session through to the end
- Confirm a new row appears in your Google Sheet within a few seconds of
  pressing Submit
- If the row appears, you're done. The platform is live.

---

## Troubleshooting

**The endpoint returns an authorization error.**
The deployment is set to `Execute as: You` but Google didn't fully authorise.
Go back to Apps Script, run any function once (e.g., `doGet`), accept all
permissions, then redeploy.

**Data submitted but no rows appear in the Sheet.**
Check the Apps Script execution log: `Executions` in the left sidebar. If
the log shows an error, the script crashed handling that submission. Common
causes: a malformed JSON payload, or Google rate-limiting.

**The platform loads but the page is blank.**
Open the browser console (F12). Most likely the CSV file isn't being found.
Confirm `public/data/master_trial_list.csv` exists in your repo and is being
deployed.

**I redeployed Apps Script and now data is going to the old URL.**
After March 2021, redeploying creates a new URL. Either: (a) update
`ENDPOINT_URL` in the code with the new URL and redeploy GitHub Pages, or
(b) use `Manage deployments` → edit existing → bump version (this preserves
the old URL).

**I want to test the endpoint without running the full platform.**
You can POST to it directly with curl:
```bash
curl -X POST 'YOUR_ENDPOINT_URL' \
  -H 'Content-Type: application/json' \
  -d '{"participant_id":"test","results":{"version":"v2.0","participant_group":"A","participant_order":"1","subframework":"Group A — Order 1","timestamp":"2026-04-28T00:00:00.000Z","trials":[],"breaks":[],"questionnaire":[]}}'
```
A row should appear in your Sheet within a few seconds.
