# GradePilot — Student Grade Calculator

GradePilot is a responsive student grade calculator with a static frontend and a Netlify Functions backend. The existing Express backend is retained for local development, while Netlify Functions provide the production API on the same Netlify domain.

## Project structure

```text
.
├── index.html
├── style.css
├── script.js
├── netlify.toml
├── render.yaml                 # retained legacy Render configuration
├── netlify/functions/
│   ├── calculate.js
│   ├── health.js
│   └── lib/grade.js
└── backend/                    # retained local Express backend
    ├── package.json
    └── server.js
```

## Netlify API routes

Netlify redirects expose these public routes:

- `GET /api/health` → Netlify Function `health`
- `POST /api/calculate` → Netlify Function `calculate`

The JSON response schema and calculation rules match the existing Express backend. The frontend calls `/api/calculate` using a relative URL, so no Render URL or API-domain configuration is needed after deployment.

## Calculations and validation

- Subjects: Mathematics, Science, English, Computer Science, and Social Studies.
- Each mark must be a number from 0 through 100, including decimals.
- Total is out of 500, percentage is `total / 500 * 100`, and average is `total / 5`.
- Grades: A+ (90–100), A (80–<90), B (70–<80), C (60–<70), D (50–<60), E (35–<50), F (<35).
- A student passes only when every subject is at least 35. Any failed subject forces the overall grade to F.

## Local development on Windows

### Option 1: Existing Express backend

Open PowerShell in the project root:

```powershell
cd C:\path\to\your\gradepilot\backend
npm install
$env:FRONTEND_ORIGIN = "http://localhost:5500"
npm start
```

In a second PowerShell window, serve the frontend:

```powershell
cd C:\path\to\your\gradepilot
python -m http.server 5500
```

The Express API runs at `http://localhost:3000`, but the browser frontend uses `/api/calculate` relative URLs. For a separate local frontend server, use a proxy or open the frontend through Netlify Dev instead.

If you specifically want the Python-served frontend to call the local Express API, temporarily change the configuration line in `index.html` to `<script>window.GRADEPILOT_API_BASE_URL = 'http://localhost:3000';</script>`. Restore it to the empty same-origin default before deploying to Netlify.

### Option 2: Netlify Dev

Install the Netlify CLI once if needed:

```powershell
npm install --global netlify-cli
```

Then run from the project root:

```powershell
netlify dev
```

Netlify Dev serves the frontend and Functions together and applies the redirects from `netlify.toml`. The exact local URL is printed by the CLI.

Verify the Function routes:

```powershell
Invoke-RestMethod http://localhost:8888/api/health

$body = @{ studentName = 'Aisha Patel'; marks = @{ mathematics = 95; science = 82.5; english = 74; computerScience = 88; socialStudies = 91 } } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8888/api/calculate -Method Post -ContentType 'application/json' -Body $body
```

## Netlify deployment

1. Push this project to GitHub.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Select the repository. The committed `netlify.toml` configures the site automatically.
4. Leave the build command empty and use the project root as the publish directory (`.`).
5. Netlify will discover Functions from `netlify/functions` and apply the `/api/*` redirects.
6. After deployment, verify `https://YOUR-NETLIFY-SITE.netlify.app/api/health`.

No deployment was performed from this workspace, so the placeholder URL above is not a claimed deployment URL.

## Testing

Verified in this workspace:

- Existing browser calculator behavior, including decimal marks, validation, grade boundaries, fail logic, and reset.
- Express backend health and calculation endpoints.
- Netlify Function JavaScript syntax with Node.js checks.
- `netlify.toml` contains the root publish directory, Functions directory, and both API redirects.

For a full local Netlify test, run `netlify dev` and use the commands above. Test invalid input such as `101` or a missing subject; the API should return HTTP 400 with a JSON `error` message.
