import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  Snackbar,
} from '@mui/material';
import { Search as SearchIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { searchService } from '@/services/search.service';
import { ProductSearchResult } from '@/types';

const Search = () => {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: results, isLoading } = useQuery({
    queryKey: ['productSearch', searchQuery],
    queryFn: () => searchService.searchProduct({ query: searchQuery }),
    enabled: searchQuery.length > 0,
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => searchService.deleteAllDocuments(),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'All indexed documents have been deleted successfully',
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      // Clear search results
      setQuery('');
      setSearchQuery('');
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete documents',
        severity: 'error',
      });
      setDeleteDialogOpen(false);
    },
  });

  const handleSearch = () => {
    if (query.trim()) {
      setSearchQuery(query.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDeleteAll = () => {
    deleteAllMutation.mutate();
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
        Product Information Search
      </Typography>

      {/* Search Bar */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={10}>
            <TextField
              fullWidth
              placeholder="Search for product information, specifications, features..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={!query.trim() || isLoading}
            >
              Search
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteAllMutation.isPending}
              size="small"
            >
              Delete All Indexed Documents
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Search Results */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {results?.data && results.data.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Found {results.data.length} results
          </Typography>
          <Grid container spacing={3}>
            {results.data.map((result: ProductSearchResult) => (
              <Grid item xs={12} key={result.id}>
                <Card
                  sx={{
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {result.title}
                      </Typography>
                      <Chip
                        label={`${Math.round((result.relevanceScore / 4) * 100)}% match`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                      {/* Extract readable content from the JSON structure */}
                      {(() => {
                        try {
                          let content = result.content;

                          // Remove markdown code fences if present
                          if (content.startsWith('```json')) {
                            content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                          } else if (content.startsWith('```')) {
                            content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
                          }

                          // Try to parse as JSON
                          const parsed = JSON.parse(content);
                          let text = parsed.extractedText || content;

                          // Clean up escaped characters
                          text = text.replace(/\\n/g, '\n').replace(/\\t/g, ' ');

                          // Show first 300 characters
                          return text.length > 300 ? text.substring(0, 300) + '...' : text;
                        } catch {
                          // If not JSON, try to extract from the string format
                          let text = result.content;

                          // Try to extract extractedText value from string
                          const match = text.match(/"extractedText":\s*"([^"]+)"/);
                          if (match && match[1]) {
                            text = match[1].replace(/\\n/g, '\n').replace(/\\t/g, ' ');
                          }

                          // Show first 300 chars
                          return text.length > 300
                            ? text.substring(0, 300) + '...'
                            : text;
                        }
                      })()}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={result.model} size="small" variant="outlined" />
                      <Chip label={result.year} size="small" variant="outlined" />
                      <Chip label={result.category} size="small" variant="outlined" />
                      <Chip label={result.source} size="small" variant="outlined" color="info" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {results?.data && results.data.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No results found for "{searchQuery}"
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try different keywords or check your spelling
          </Typography>
        </Paper>
      )}

      {!searchQuery && !isLoading && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Enter a search query to find product information
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Search across technical specifications, features, and marketing materials
          </Typography>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete All Indexed Documents?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete all documents from the knowledge base search index.
            This action cannot be undone. You will need to re-upload documents to rebuild the index.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAll}
            color="error"
            variant="contained"
            disabled={deleteAllMutation.isPending}
          >
            {deleteAllMutation.isPending ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Search;
