import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Download,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { complianceService } from '@/services/compliance.service';
import { IssueSeverity, ComplianceStatus } from '@/types';
import { toast } from 'react-toastify';

const ComplianceReview = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const [downloading, setDownloading] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['complianceReport', assetId],
    queryFn: () => assetId ? complianceService.getReport(assetId) : null,
    enabled: !!assetId,
  });

  const handleDownloadPdf = async () => {
    if (!assetId) return;
    setDownloading(true);
    try {
      await complianceService.downloadPdfReport(assetId);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF report');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadHtml = async () => {
    if (!assetId) return;
    setDownloading(true);
    try {
      await complianceService.downloadHtmlReport(assetId);
      toast.success('HTML report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download HTML report');
    } finally {
      setDownloading(false);
    }
  };

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.CRITICAL:
        return 'error';
      case IssueSeverity.HIGH:
        return 'error';
      case IssueSeverity.MEDIUM:
        return 'warning';
      case IssueSeverity.LOW:
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case ComplianceStatus.PASSED:
        return <CheckCircle color="success" />;
      case ComplianceStatus.WARNING:
        return <Warning color="warning" />;
      case ComplianceStatus.FAILED:
        return <ErrorIcon color="error" />;
      default:
        return <CircularProgress size={24} />;
    }
  };

  if (!assetId) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Compliance Review
        </Typography>
        <Alert severity="info">Please select an asset to view compliance report</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!report?.data) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Compliance Review
        </Typography>
        <Alert severity="error">Compliance report not found</Alert>
      </Box>
    );
  }

  const { data: reportData } = report;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Compliance Report
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownloadHtml}
            disabled={downloading}
          >
            HTML
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            PDF
          </Button>
        </Box>
      </Box>

      {/* Summary Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {reportData.fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Processed: {new Date(reportData.processedAt).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
              {getStatusIcon(reportData.overallStatus)}
              <Typography variant="h6">
                {reportData.overallStatus.toUpperCase()}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                {reportData.summary.criticalIssues}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical Issues
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                {reportData.summary.highIssues}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Issues
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                {reportData.summary.imagesAnalyzed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Images Analyzed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                {Math.round(reportData.summary.overallConfidence * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Text Compliance Issues */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Text Compliance Issues
        </Typography>
        {reportData.textCompliance.issues.length > 0 ? (
          reportData.textCompliance.issues.map((issue) => (
            <Box
              key={issue.id}
              sx={{
                p: 2,
                mb: 2,
                borderLeft: 4,
                borderColor: `${getSeverityColor(issue.severity)}.main`,
                backgroundColor: 'background.default',
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {issue.message}
                </Typography>
                <Chip label={issue.severity} color={getSeverityColor(issue.severity)} size="small" />
              </Box>
              {issue.suggestion && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Suggestion: {issue.suggestion}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Confidence: {Math.round(issue.confidence * 100)}% | Category: {issue.category}
              </Typography>
            </Box>
          ))
        ) : (
          <Alert severity="success">No text compliance issues found</Alert>
        )}
      </Paper>

      {/* Image Compliance Issues */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Image Compliance Issues
        </Typography>
        {reportData.imageCompliance && reportData.imageCompliance.length > 0 ? (
          reportData.imageCompliance.map((image) => (
            <Box key={image.imageId} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Image {image.imageId} (Page {image.pageNumber})
              </Typography>
              {image.issues.length > 0 ? (
                image.issues.map((issue) => (
                  <Box
                    key={issue.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderLeft: 4,
                      borderColor: `${getSeverityColor(issue.severity)}.main`,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{issue.message}</Typography>
                      <Chip label={issue.severity} color={getSeverityColor(issue.severity)} size="small" />
                    </Box>
                  </Box>
                ))
              ) : (
                <Alert severity="success" sx={{ mb: 2 }}>
                  No issues found for this image
                </Alert>
              )}
              <Divider sx={{ my: 2 }} />
            </Box>
          ))
        ) : (
          <Alert severity="info">No images found in this asset</Alert>
        )}
      </Paper>
    </Box>
  );
};

export default ComplianceReview;
