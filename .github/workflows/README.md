# GitHub Actions Workflows

## Trigger Dynatrace Workflow

This workflow automatically triggers a Dynatrace workflow whenever code is pushed to the main/master branch.

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
   - By default, triggers on pushes to `main` or `master` branches
   - Uncomment sections to trigger on other branches or pull requests

### How it works

When a commit is pushed to the repository:
1. GitHub Actions runs the workflow
2. Makes a POST request to the Dynatrace Automation API
3. Triggers your Dynatrace workflow execution

### Environment Variables

- `DYNATRACE_BEARER_TOKEN`: Your Dynatrace API bearer token (stored as GitHub Secret)

