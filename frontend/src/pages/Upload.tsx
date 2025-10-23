import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  TextField,
  Grid,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { assetService } from '@/services/asset.service';
import { UploadProgress } from '@/types';

const Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [metadata, setMetadata] = useState({
    model: '',
    year: '',
    category: '',
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error('Please select a valid file');
      return;
    }

    const file = acceptedFiles[0];

    // Validate file size (max 50MB for PoC)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    setUploadProgress({
      uploadId: '',
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    });

    try {
      const response = await assetService.uploadAsset(
        file,
        metadata,
        (progress) => {
          setUploadProgress((prev) => prev ? { ...prev, progress } : null);
        }
      );

      if (response.success) {
        setUploadProgress({
          uploadId: response.data?.id || '',
          fileName: file.name,
          progress: 100,
          status: 'completed',
          message: 'Upload successful! Processing will begin shortly.',
        });
        toast.success('File uploaded successfully!');

        // Reset after 3 seconds
        setTimeout(() => {
          setUploadProgress(null);
          setMetadata({ model: '', year: '', category: '' });
        }, 3000);
      } else {
        throw new Error(response.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({
        uploadId: '',
        fileName: file.name,
        progress: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [metadata]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: false,
    disabled: uploading,
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
        Upload Marketing Asset
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Upload Area */}
          <Paper
            {...getRootProps()}
            sx={{
              p: 6,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'divider',
              backgroundColor: isDragActive ? 'primary.light' : 'background.paper',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: uploading ? 'background.paper' : 'background.default',
              },
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            {isDragActive ? (
              <Typography variant="h6" color="primary">
                Drop the file here...
              </Typography>
            ) : (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Drag & drop a file here, or click to select
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported: PDF, PNG, JPG (Max 50MB)
                </Typography>
              </>
            )}
          </Paper>

          {/* Upload Progress */}
          {uploadProgress && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {uploadProgress.fileName}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={uploadProgress.progress}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                {uploadProgress.status === 'uploading' && `Uploading... ${uploadProgress.progress}%`}
                {uploadProgress.status === 'completed' && uploadProgress.message}
                {uploadProgress.status === 'error' && uploadProgress.message}
              </Typography>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Metadata Form */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Asset Metadata (Optional)
            </Typography>
            <TextField
              fullWidth
              label="Model"
              value={metadata.model}
              onChange={(e) => setMetadata({ ...metadata, model: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="e.g., Camry"
              disabled={uploading}
            />
            <TextField
              fullWidth
              label="Year"
              value={metadata.year}
              onChange={(e) => setMetadata({ ...metadata, year: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="e.g., 2024"
              disabled={uploading}
            />
            <TextField
              fullWidth
              label="Category"
              value={metadata.category}
              onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
              placeholder="e.g., Brochure"
              disabled={uploading}
            />
          </Paper>

          {/* Instructions */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              What happens next?
            </Typography>
            <Box component="ol" sx={{ pl: 2 }}>
              <li>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  File is uploaded to secure storage
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  AI agents extract text and images
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Compliance checks are performed
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Report is generated and ready for review
                </Typography>
              </li>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Upload;
