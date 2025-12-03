import { result } from '@dynatrace-sdk/automation-utils';
import {
    credentialVaultClient,
    CredentialsDetailsTokenResponseElement,
  } from '@dynatrace-sdk/client-classic-environment-v2';

/**
 * Dynatrace Workflow Action: Upload Lookup Data
 * 
 * This action uploads lookup data to Dynatrace Grail Resource Store
 * using data from previous workflow tasks.
 */
export default async function () {

    // Configuration
    // NOTE: API_TOKEN and DT_URL should be configured in your Dynatrace workflow settings
    // or passed as workflow inputs. Do not hardcode secrets in the code.
    const DT_URL = process.env.DT_URL || 'https://nzi70060.sprint.apps.dynatracelabs.com';
    const tokenCredentials = await credentialVaultClient.getCredentialsDetails({
        id: 'CREDENTIALS_VAULT-4CAA8C8350C3FF4A',
    });
    
    
    if (!tokenCredentials) {
        throw new Error('API_TOKEN is required. Please configure it in your Dynatrace workflow settings.');
    }
    
    // Get data from previous tasks
    const lookupJsonPayloadRaw = await result('retrieve-payload');
    const csvContentRaw = await result('retrieve-csv');

    // Extract content from the result objects (they have a 'content' property)
    const lookupJsonPayloadString = (lookupJsonPayloadRaw && lookupJsonPayloadRaw.content) 
        ? lookupJsonPayloadRaw.content 
        : (typeof lookupJsonPayloadRaw === 'string' ? lookupJsonPayloadRaw : JSON.stringify(lookupJsonPayloadRaw));
    
    let csvContentString = (csvContentRaw && csvContentRaw.content) 
        ? csvContentRaw.content 
        : (typeof csvContentRaw === 'string' ? csvContentRaw : String(csvContentRaw));

    // Debug logging
    console.log('=== Debug: Retrieved Data ===');
    console.log('lookupJsonPayloadRaw type:', typeof lookupJsonPayloadRaw);
    console.log('lookupJsonPayloadString preview:', lookupJsonPayloadString.substring(0, 200));
    console.log('csvContentString length:', csvContentString.length);
    console.log('csvContentString preview (first 200 chars):', csvContentString.substring(0, 200));

    // API endpoint - using the correct Resource Store API endpoint
    const API_PATH = '/platform/storage/resource-store/v1/files/tabular/lookup:upload';
    const ENDPOINT_URL = `${DT_URL}${API_PATH}`;

    // Parse and validate the JSON payload
    let requestParams;
    try {
        requestParams = JSON.parse(lookupJsonPayloadString);
        console.log('Parsed requestParams:', requestParams);
    } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error(`Invalid JSON payload from retrieve-payload task: ${e.message}`);
    }
    
    // Remove header row from CSV if skippedRecords > 0
    // This ensures headers aren't ingested even if the API parameter doesn't work as expected
    // We do this BEFORE sending to ensure the CSV order is preserved
    if (requestParams.skippedRecords > 0) {
        const lines = csvContentString.split('\n').filter(line => line.trim() !== ''); // Remove empty lines
        if (lines.length > requestParams.skippedRecords) {
            // Remove the first N lines (header rows) and preserve order
            csvContentString = lines.slice(requestParams.skippedRecords).join('\n');
            console.log(`Removed ${requestParams.skippedRecords} header row(s) from CSV. Remaining lines: ${lines.length - requestParams.skippedRecords}`);
            console.log('CSV after header removal (first 200 chars):', csvContentString.substring(0, 200));
        } else {
            console.warn(`Warning: CSV has ${lines.length} lines but skippedRecords is ${requestParams.skippedRecords}`);
        }
    }
    
    // Validate required fields
    console.log('Validating requestParams...');
    console.log('filePath:', requestParams.filePath);
    console.log('lookupField:', requestParams.lookupField);
    console.log('parsePattern:', requestParams.parsePattern);
    
    if (!requestParams.filePath || requestParams.filePath.trim() === '') {
        console.error('filePath validation failed. requestParams keys:', Object.keys(requestParams));
        throw new Error('filePath is required and must not be empty in the request payload');
    }
    if (!requestParams.lookupField || requestParams.lookupField.trim() === '') {
        throw new Error('lookupField is required and must not be blank in the request payload');
    }
    if (!requestParams.parsePattern || requestParams.parsePattern.trim() === '') {
        throw new Error('parsePattern is required and must not be blank in the request payload');
    }

    // Add current date to description dynamically
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const dateFormatted = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }); // Format: "January 1, 2025"
    
    // Update description with date
    if (requestParams.description) {
        requestParams.description = `${requestParams.description} on ${dateFormatted}`;
    } else {
        requestParams.description = `Uploaded on ${dateFormatted}`;
    }
    
    console.log('Updated description:', requestParams.description);

    // Convert back to JSON string for the form data
    const requestPayload = JSON.stringify(requestParams);

    // Use FormData API - this should match curl -F format exactly
    const formData = new FormData();
    
    // Add request part (JSON string) - matches: -F 'request={...}'
    formData.append('request', requestPayload);
    
    // Add content part (CSV data as Blob) - matches: -F 'content=@file;type=text/plain'
    const csvBlob = new Blob([csvContentString], { type: 'text/plain' });
    formData.append('content', csvBlob, 'data.csv');

    // Execute the HTTP request using fetch API
    try {
        const response = await fetch(ENDPOINT_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenCredentials.token}`,
                'accept': '*/*'
                // DO NOT set Content-Type - fetch will set it automatically with boundary
            },
            body: formData
        });

        // Parse response body
        let responseBody;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            responseBody = await response.json();
        } else {
            responseBody = await response.text();
        }

        // Check for success (HTTP 2xx status codes)
        if (response.status >= 200 && response.status < 300) {
            return {
                message: `Successfully uploaded lookup data. Status: ${response.status}`,
                statusCode: response.status,
                responseBody: responseBody
            };
        } else {
            // Throw API errors
            throw new Error(`API call failed with status ${response.status}: ${JSON.stringify(responseBody)}`);
        }
    } catch (error) {
        // Re-throw any errors (including network errors) to fail the action
        throw error;
    }
}

