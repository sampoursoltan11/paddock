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
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/search.service';
import { ProductSearchResult } from '@/types';

const Search = () => {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: results, isLoading } = useQuery({
    queryKey: ['productSearch', searchQuery],
    queryFn: () => searchService.searchProduct({ query: searchQuery }),
    enabled: searchQuery.length > 0,
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
                        label={`${Math.round(result.relevanceScore * 100)}% match`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {result.content}
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
    </Box>
  );
};

export default Search;
