const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Azure Storage connection string from environment
const connectionString = process.env.AzureWebJobsStorage;
const accountName = 'smartproofstordev01295';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || 'REDACTED-AZURE-KEY==';

async function uploadTestDocument() {
  try {
    console.log('Starting test upload...');

    // Create BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`
    );

    // Get container client
    const containerClient = blobServiceClient.getContainerClient('uploads');

    // Ensure container exists (public access for blob)
    try {
      await containerClient.createIfNotExists({ access: 'blob' });
      console.log('Container "uploads" ready');
    } catch (err) {
      console.log('Container already exists or access issue:', err.message);
    }

    // Upload ID
    const uploadId = uuidv4();
    console.log('Upload ID:', uploadId);

    // Read the test PDF
    const testFile = path.join(
      __dirname,
      'test-documents',
      '2026 Toyota Corolla Hatchback - Product Information.pdf'
    );

    if (!fs.existsSync(testFile)) {
      throw new Error(`Test file not found: ${testFile}`);
    }

    const fileContent = fs.readFileSync(testFile);
    const fileName = '2026 Toyota Corolla Hatchback - Product Information.pdf';
    const blobName = `${uploadId}/${fileName}`;

    console.log('Uploading file:', fileName);
    console.log('Blob name:', blobName);
    console.log('File size:', (fileContent.length / 1024).toFixed(2), 'KB');

    // Get block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file
    const uploadResult = await blockBlobClient.upload(fileContent, fileContent.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/pdf',
      },
    });

    console.log('✓ File uploaded successfully!');
    console.log('Upload request ID:', uploadResult.requestId);
    console.log('Blob URL:', blockBlobClient.url);

    // Save workflow state
    const stateContainerClient = blobServiceClient.getContainerClient('state');
    await stateContainerClient.createIfNotExists();

    const workflowState = {
      uploadId,
      status: 'pending',
      currentAgent: 'orchestrator',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agents: {
        orchestrator: { status: 'pending' },
        parser: { status: 'pending' },
        'image-analysis': { status: 'pending' },
        search: { status: 'pending' },
        compliance: { status: 'pending' },
        critic: { status: 'pending' },
      },
    };

    const stateBlob = stateContainerClient.getBlockBlobClient(`${uploadId}/workflow-state.json`);
    await stateBlob.upload(
      JSON.stringify(workflowState, null, 2),
      JSON.stringify(workflowState).length,
      {
        blobHTTPHeaders: {
          blobContentType: 'application/json',
        },
      }
    );

    console.log('✓ Workflow state saved');
    console.log('\n========================================');
    console.log('Upload complete!');
    console.log('Upload ID:', uploadId);
    console.log('File Name:', fileName);
    console.log('========================================');
    console.log('\nThe blob trigger should now process this file.');
    console.log('Check backend.log for processing progress.');

    return { uploadId, fileName, blobUrl: blockBlobClient.url };
  } catch (error) {
    console.error('Error uploading test document:', error);
    throw error;
  }
}

// Run the upload
uploadTestDocument()
  .then(result => {
    console.log('\n✓ Test upload completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Test upload failed:', error.message);
    process.exit(1);
  });
