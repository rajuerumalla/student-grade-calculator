# GradePilot — Student Grade Calculator

GradePilot is a responsive student grade calculator with the existing static frontend preserved and an optional Node.js/Express API backend. The calculator works locally in the browser even when the API is unavailable; when an API base URL is configured, the frontend posts calculations to the backend.

## Project structure

```text
.
├── index.html
├── style.css
├── script.js
├── netlify.toml
├── render.yaml
└── backend/
    ├── package.json
    ├── server.js
    └── .gitignore
```

## Features and calculations

- Five subjects: Mathematics, Science, English, Computer Science, and Social Studies.
- Marks accept decimal values from 0 through 100.
- Total is out of 500, percentage is `total / 500 * 100`, and average is `total / 5`.
- Grades: A+ (90–100), A (80–<90), B (70–<80), C (60–<70), D (50–<60), E (35–<50), F (<35).
- A student passes only when every subject is at least 35. Any failed subject forces the overall grade to F.

## API

The backend exposes:

- `GET /api/health` — returns `{ "status": "ok", "service": "gradepilot-api" }`.
- `POST /api/calculate` — accepts `{ "studentName": "Aisha", "marks": { "mathematics": 95, "science": 82.5, "english": 74, "computerScience": 88, "socialStudies": 91 } }` and returns validated calculation data.

## Windows local run

Open PowerShell in the project root:

```powershell
cd C:\path\to\your\gradepilot
cd backend
npm install
$env:FRONTEND_ORIGIN = "http://localhost:5500"
npm start
```

The API runs at `http://localhost:3000` by default. To verify it:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Run the frontend in a second PowerShell window. A simple option is VS Code Live Server at `http://localhost:5500`. Another option is Python if installed:

```powershell
cd C:\path\to\your\gradepilot
python -m http.server 5500
```

To connect the frontend to the local API, set the value in `index.html` before the `script.js` tag:

```html
<script>window.GRADEPILOT_API_BASE_URL = 'http://localhost:3000';</script>
```

The checked-in default is empty, so the frontend remains usable with local calculation when no backend URL has been configured.

## Netlify frontend deployment

1. Push this project to GitHub or prepare the project folder.
2. In Netlify, choose **Add new site → Import an existing project** or **Deploy manually**.
3. For a Git repository, set the publish directory to `.` and leave the build command empty. `netlify.toml` already contains this configuration.
4. After Netlify gives you the frontend URL, configure `window.GRADEPILOT_API_BASE_URL` in `index.html` to your Render backend URL, commit the change, and redeploy.

Netlify does not provide runtime environment variables to a plain static HTML file without a build step, so the API URL is intentionally a small, explicit frontend configuration value.

## Render backend deployment

1. Push the project, including `backend/package.json`, `backend/server.js`, and `render.yaml`, to GitHub.
2. In Render, choose **New → Blueprint** and select the repository. Render will use `render.yaml` and create the Node web service with `backend` as its root directory.
3. In the service environment settings, set `FRONTEND_ORIGIN` to the exact Netlify origin, such as `https://your-site-name.netlify.app`. Do not add a trailing slash. Multiple origins can be comma-separated.
4. Deploy the service. Render supplies the backend URL; verify it with `/api/health`.
5. Put that backend URL in `window.GRADEPILOT_API_BASE_URL` in `index.html` and redeploy the Netlify frontend.

No deployment has been performed from this workspace, so no hosted URLs are claimed here.

## Testing checklist

Frontend behavior was verified in the browser for valid decimal marks, grade boundaries, the below-35 fail rule, out-of-range validation, and reset. Backend checks to run locally after `npm install` are:

```powershell
Invoke-RestMethod http://localhost:3000/api/health

$body = @{ studentName = 'Aisha Patel'; marks = @{ mathematics = 95; science = 82.5; english = 74; computerScience = 88; socialStudies = 91 } } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/calculate -Method Post -ContentType 'application/json' -Body $body
```

Also test a missing mark and a value such as `101`; the API should respond with HTTP 400 and a JSON `error` message.
