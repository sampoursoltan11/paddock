/**
 * Test script to manually trigger document processing
 * This calls the orchestrator agent directly to process the uploaded PDF
 */

const UPLOAD_ID = '8927cfeb-f308-47b5-ad91-e2cdf4aa7cf3';
const FILE_NAME = '2026 Toyota Corolla Hatchback - Product Information.pdf';
const BLOB_URL = `https://smartproofstordev01295.blob.core.windows.net/uploads/${UPLOAD_ID}/${encodeURIComponent(FILE_NAME)}`;

console.log('='.repeat(60));
console.log('Testing Document Processing');
console.log('='.repeat(60));
console.log('Upload ID:', UPLOAD_ID);
console.log('File Name:', FILE_NAME);
console.log('Blob URL:', BLOB_URL);
console.log('='.repeat(60));
console.log('\nCalling orchestrator agent...\n');

// We'll use curl to call a test endpoint, or we can import the function directly
// For now, let's just output the command to run

const command = `curl -X POST http://localhost:7071/api/test-process \\
  -H "Content-Type: application/json" \\
  -d '{
    "uploadId": "${UPLOAD_ID}",
    "fileName": "${FILE_NAME}",
    "blobUrl": "${BLOB_URL}"
  }'`;

console.log('Run this command to trigger processing:');
console.log(command);
console.log('\n' + '='.repeat(60));
console.log('Or we can create a simple HTTP function to trigger it.');
console.log('For now, let me create a direct TypeScript test instead...');
