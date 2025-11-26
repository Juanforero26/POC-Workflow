# POC-Workflow

Workflow for automating the ingestion of lookup tables using Dynatrace workflows

This repository contains JavaScript code for uploading tabular lookup data to the Dynatrace Grail Resource Store, along with GitHub Actions integration to automatically trigger Dynatrace workflows on commits.

## Features

- Upload lookup data to Dynatrace Grail Resource Store
- Dynatrace Workflow action for automated data ingestion
- GitHub Actions integration to trigger Dynatrace workflows on commits

## Installation

```bash
npm install
```

## Usage

### Dynatrace Workflow Action

The `dynatrace-workflow-action.js` file is designed to be used within a Dynatrace workflow. It retrieves JSON payload and CSV content from previous workflow tasks and uploads them to the Grail Resource Store.

**Important:** Do not hardcode API tokens in the code. Configure them in your Dynatrace workflow settings or use environment variables.

### Node.js Module

For standalone Node.js usage, see the `dynatrace-lookup-upload.js` module.

## GitHub Actions Integration

This repository includes a GitHub Actions workflow that automatically triggers your Dynatrace workflow whenever code is pushed to the repository.

### Setup

1. **Add GitHub Secret:**
   - Go to your repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DYNATRACE_BEARER_TOKEN`
   - Value: Your Dynatrace Bearer token

2. **Update Workflow ID (if needed):**
   - Edit `.github/workflows/trigger-dynatrace-workflow.yml`
   - Update the workflow ID in the URL: `70740001-1420-400d-bb00-49fed3a454cb`

3. **Customize Triggers:**
   - By default, triggers on pushes to `main` or `master` branches
   - Edit the `on:` section to customize when the workflow runs

### How it works

When a commit is pushed to the repository:
1. GitHub Actions runs the workflow
2. Makes a POST request to the Dynatrace Automation API
3. Triggers your Dynatrace workflow execution

See `.github/workflows/README.md` for more details.
