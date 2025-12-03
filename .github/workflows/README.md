# GitHub Actions Workflows

## Trigger Dynatrace Workflow

This workflow automatically triggers a Dynatrace workflow **only when CSV files are changed** in the repository. This allows you to maintain the codebase (update JavaScript, documentation, etc.) without triggering the workflow unnecessarily.

### Setup

1. **Add GitHub Secret:**
   - Go to your repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DYNATRACE_BEARER_TOKEN`
   - Value: Your Dynatrace Bearer token

2. **Update Workflow ID (if needed):**
   - Edit `.github/workflows/trigger-dynatrace-workflow.yml`
   - Update the workflow ID in the URL if it's different: `70740001-1420-400d-bb00-49fed3a454cb`

3. **Customize Triggers:**
   - By default, triggers only when `.csv` files are changed in pushes to `main` or `master` branches
   - You can modify the `paths` section to include other file patterns if needed

### How it works

When a CSV file is changed and pushed to the repository:
1. GitHub Actions detects the CSV file change
2. Runs the workflow
3. Makes a POST request to the Dynatrace Automation API
4. Triggers your Dynatrace workflow execution

**Note:** Changes to other files (JavaScript, JSON, documentation, etc.) will NOT trigger the workflow, allowing you to maintain the repository without unnecessary workflow runs.

### Environment Variables

- `DYNATRACE_BEARER_TOKEN`: Your Dynatrace API bearer token (stored as GitHub Secret)

