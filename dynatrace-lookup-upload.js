/**
 * Dynatrace Grail Resource Store - Lookup Data Upload
 * 
 * This script uploads tabular data to the Dynatrace Grail Resource Store
 * using the multipart/form-data endpoint.
 */

const FormData = require('form-data');
const fs = require('fs');
const https = require('https');
const http = require('http');

/**
 * Uploads lookup data to Dynatrace Grail Resource Store
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.environmentUrl - Dynatrace environment URL (e.g., 'https://your-environment.live.dynatrace.com')
 * @param {string} config.apiToken - Dynatrace API token with 'storage:files:write' permission
 * @param {string} config.filePath - Fully qualified path for the file in Grail (e.g., '/lookups/mydata')
 * @param {string} config.parsePattern - DPL pattern used to parse the uploaded data (e.g., 'LD:id "," LD:value')
 * @param {string} config.lookupField - Name of the lookup field that uniquely identifies a record
 * @param {string|Buffer} config.content - The lookup data content (text format)
 * @param {Object} config.options - Optional parameters
 * @param {boolean} config.options.overwrite - Allow overwriting existing file (default: false)
 * @param {string} config.options.displayName - Optional name for the file (max 500 chars)
 * @param {string} config.options.description - Optional description for the file (max 500 chars)
 * @param {number} config.options.skippedRecords - Number of initial records to discard (default: 0)
 * @param {string} config.options.timezone - Timezone for parsing time/date fields (e.g., 'UTC')
 * @param {string} config.options.locale - Locale for parsing (e.g., 'en_US')
 * @param {boolean} config.options.autoFlatten - Extract nested fields to root level (default: true)
 * @returns {Promise<Object>} Response from the API
 */
async function uploadLookupData(config) {
  const {
    environmentUrl,
    apiToken,
    filePath,
    parsePattern,
    lookupField,
    content,
    options = {}
  } = config;

  // Validate required parameters
  if (!environmentUrl || !apiToken || !filePath || !parsePattern || !lookupField || !content) {
    throw new Error('Missing required parameters: environmentUrl, apiToken, filePath, parsePattern, lookupField, and content are all required');
  }

  // Validate filePath format
  if (!filePath.startsWith('/lookups')) {
    throw new Error('filePath must start with /lookups');
  }

  if (!/^[a-zA-Z0-9\/\.\-]+$/.test(filePath)) {
    throw new Error('filePath contains invalid characters. Only alphanumeric, hyphens, periods, and forward slashes are allowed');
  }

  if (!/[a-zA-Z0-9]$/.test(filePath)) {
    throw new Error('filePath must end with an alphanumeric character');
  }

  // Construct the request body
  const formData = new FormData();

  // Build request JSON
  const requestParams = {
    filePath: filePath,
    parsePattern: parsePattern,
    lookupField: lookupField,
    overwrite: options.overwrite !== undefined ? options.overwrite : false,
    autoFlatten: options.autoFlatten !== undefined ? options.autoFlatten : true,
    skippedRecords: options.skippedRecords !== undefined ? options.skippedRecords : 0
  };

  // Add optional parameters
  if (options.displayName) {
    if (options.displayName.length > 500) {
      throw new Error('displayName must be 500 characters or less');
    }
    requestParams.displayName = options.displayName;
  }

  if (options.description) {
    if (options.description.length > 500) {
      throw new Error('description must be 500 characters or less');
    }
    requestParams.description = options.description;
  }

  if (options.timezone) {
    requestParams.timezone = options.timezone;
  }

  if (options.locale) {
    requestParams.locale = options.locale;
  }

  // Add request part (JSON)
  formData.append('request', JSON.stringify(requestParams), {
    contentType: 'application/json'
  });

  // Add content part (text data)
  // If content is a file path, read it; otherwise use the provided content
  let contentData = content;
  if (typeof content === 'string' && fs.existsSync(content)) {
    contentData = fs.readFileSync(content, 'utf8');
  }

  formData.append('content', contentData, {
    contentType: 'text/plain'
  });

  // Construct the API endpoint URL
  const url = new URL(`${environmentUrl}/api/v2/grail/lookups/upload`);
  
  // Prepare request options
  const requestOptions = {
    method: 'POST',
    headers: {
      'Authorization': `Api-Token ${apiToken}`,
      ...formData.getHeaders()
    }
  };

  // Make the request
  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsed
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData
            });
          }
        } else {
          let errorMessage = `Request failed with status ${res.statusCode}`;
          try {
            const errorData = JSON.parse(responseData);
            errorMessage += `: ${JSON.stringify(errorData)}`;
          } catch (e) {
            errorMessage += `: ${responseData}`;
          }
          reject(new Error(errorMessage));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    // Pipe form data to request
    formData.pipe(req);
  });
}

// Export the function
module.exports = { uploadLookupData };

