import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  Assessment,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { complianceService } from '@/services/compliance.service';
import { assetService } from '@/services/asset.service';

const Dashboard = () => {
  const [dateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
    to: new Date().toISOString(),
  });

  // Fetch compliance statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['complianceStats', dateRange],
    queryFn: () => complianceService.getComplianceStats(dateRange.from, dateRange.to),
  });

  // Fetch recent assets
  const { data: recentAssets, isLoading: assetsLoading } = useQuery({
    queryKey: ['recentAssets'],
    queryFn: () => assetService.getAssets(1, 10),
  });

  const statCards = [
    {
      title: 'Total Reports',
      value: stats?.data?.totalReports || 0,
      icon: <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: '#3498DB',
    },
    {
      title: 'Passed',
      value: stats?.data?.passedReports || 0,
      icon: <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />,
      color: '#27AE60',
    },
    {
      title: 'Warnings',
      value: stats?.data?.warningReports || 0,
      icon: <Warning sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: '#F39C12',
    },
    {
      title: 'Failed',
      value: stats?.data?.failedReports || 0,
      icon: <Error sx={{ fontSize: 40, color: 'error.main' }} />,
      color: '#E74C3C',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
        Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography variant="h3" sx={{ mb: 1, fontWeight: 700, color: card.color }}>
                  {statsLoading ? <CircularProgress size={32} /> : card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Assets
            </Typography>
            {assetsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : recentAssets?.data?.items && recentAssets.data.items.length > 0 ? (
              <Box>
                {recentAssets.data.items.map((asset) => (
                  <Box
                    key={asset.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        backgroundColor: 'background.default',
                      },
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {asset.fileName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded: {new Date(asset.uploadedAt).toLocaleDateString()} | Status: {asset.status}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No recent assets found. Upload your first asset to get started.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Common Issues
            </Typography>
            {statsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : stats?.data?.commonIssues && stats.data.commonIssues.length > 0 ? (
              <Box>
                {stats.data.commonIssues.map((issue, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 1,
                      backgroundColor: 'background.default',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {issue.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {issue.count} occurrences
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No issues data available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Quick Start
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Get started with SmartProof AI:
        </Typography>
        <Box component="ul" sx={{ pl: 3 }}>
          <li>
            <Typography variant="body2">
              <strong>Upload</strong> marketing assets (PDFs, images) for automated compliance checking
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Search</strong> product information using AI-powered semantic search
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Review</strong> compliance reports with detailed analysis and suggestions
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Download</strong> PDF/HTML reports for documentation and approval workflows
            </Typography>
          </li>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
