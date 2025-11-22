# Deployment Instructions (CI/CD via Git)

You can configure Google Cloud to automatically deploy your app whenever you push to GitHub.

## 1. Connect Repository

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to **Cloud Build** > **Triggers**.
3.  Click **Create Trigger**.
4.  **Source**: Select your GitHub repository.
5.  **Event**: Push to a branch (e.g., `main`).

## 2. Configure Build Configuration

1.  **Configuration**: Select **Cloud Build configuration file (yaml or json)**.
2.  **Location**: Repository.
3.  **File location**: `cloudbuild.yaml` (this file is already in your repo).

## 3. Set Substitution Variables (Critical!)

Since your API key is not in Git, you must provide it here.

1.  Under **Advanced** > **Substitution variables**, add a new variable:
    -   **Variable**: `_GEMINI_API_KEY`
    -   **Value**: Your actual Gemini API Key (e.g., `AIzaSy...`)

## 4. Save and Run

1.  Click **Create**.
2.  You can manually **Run** the trigger to test it, or simply push a commit to your repository to start the deployment!

---

## Manual Deployment (Fallback)

If you prefer to deploy manually from your machine:

1.  Ensure you have `.env` locally.
2.  Run:
    ```bash
    npm run build
    gcloud app deploy
    ```
