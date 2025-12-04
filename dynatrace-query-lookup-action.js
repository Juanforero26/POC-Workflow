import { result } from '@dynatrace-sdk/automation-utils';
import { queryExecutionClient } from '@dynatrace-sdk/client-query';

/**
 * Dynatrace Workflow Action: Query Lookup Data
 * 
 * This action reads a lookup table from Dynatrace Grail using DQL
 * based on the filePath from the previous upload action's response.
 */
export default async function () {
    
    // Get filePath from the previous upload action's result
    const uploadResult = await result('upload-lookup-data'); // Replace with your actual action name
    
    // Extract filePath from the result
    const filePath = uploadResult?.filePath || uploadResult?.content?.filePath;

    if (!filePath) {
        throw new Error('filePath not found in previous action result. Make sure the upload action returns filePath.');
    }

    // Construct DQL query to read from the lookup table
    const dqlQuery = `fetch lookup [${filePath}]`;

    // Execute the DQL query using the SDK client
    const data = await queryExecutionClient.queryExecute({
        body: {
            query: dqlQuery,
        },
    });

    return {
        message: `Successfully queried lookup table at ${filePath}`,
        filePath: filePath,
        recordCount: data.records ? data.records.length : 0,
        records: data.records || [],
        fullResponse: data
    };
}

