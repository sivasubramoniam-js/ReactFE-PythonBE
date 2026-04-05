import React, { useState, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, InputAdornment,
  IconButton, CircularProgress, Chip, Button, Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  OpenInNew as OpenIcon,
  ManageSearch as LibraryIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';

function SubtitleSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const search = async (q) => {
    const term = (q || query).trim();
    if (!term || term.length < 2) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await axios.get(`/searchSubtitles?q=${encodeURIComponent(term)}`);
      setResults(res.data.results || []);
    } catch {
      setError('Search failed. Try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ background: 'rgba(255,232,93,0.35)', color: '#ffe85d', borderRadius: 2, padding: '0 2px' }}>
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const extractTimestamp = (segment) => {
    const match = segment.match(/\[(\d+\.\d+)\s*-\s*\d+\.\d+\]/);
    if (match) {
      const secs = Math.floor(parseFloat(match[1]));
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      return { timestamp: `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, seconds: secs };
    }
    return null;
  };

  const cleanSegment = (seg) => seg.replace(/\[\d+\.\d+\s*-\s*\d+\.\d+\]\s*/, '');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LibraryIcon sx={{ color: '#08cfff' }} />
        <Typography variant="h6" className="styled-color" sx={{ fontWeight: 'bold' }}>
          Search My Library
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
        Search across all videos you've ever analyzed. Finds the exact moment in any video.
      </Typography>

      {/* Search input */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="e.g. gradient descent, async await, neural network…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#888', fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => { setQuery(''); setResults([]); setSearched(false); }}>
                  <ClearIcon sx={{ fontSize: 16, color: '#888' }} />
                </IconButton>
              </InputAdornment>
            ),
            style: { color: 'white' }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
              '&.Mui-focused fieldset': { borderColor: '#08cfff' }
            }
          }}
        />
        <Button
          variant="contained"
          onClick={() => search()}
          disabled={loading || query.trim().length < 2}
          sx={{
            background: 'linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%)',
            color: '#000', fontWeight: 'bold', minWidth: 80
          }}
        >
          {loading ? <CircularProgress size={18} sx={{ color: '#000' }} /> : 'Search'}
        </Button>
      </Box>

      {/* Results */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {error && <Typography sx={{ color: '#f44336', mb: 2 }}>{error}</Typography>}

        {searched && !loading && results.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: '#888' }}>No results found for "{query}"</Typography>
            <Typography variant="caption" sx={{ color: '#555', mt: 1, display: 'block' }}>
              Only videos you've previously analyzed are searchable.
            </Typography>
          </Box>
        )}

        {!searched && !loading && (
          <Box sx={{ textAlign: 'center', py: 6, opacity: 0.5 }}>
            <LibraryIcon sx={{ fontSize: 56, color: '#555', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#666' }}>Your analyzed video library will appear here</Typography>
          </Box>
        )}

        {results.map((r, i) => (
          <Card key={i} sx={{
            mb: 2,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 3,
            overflow: 'hidden'
          }}>
            {/* Video header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Avatar src={r.thumbnail} variant="rounded" sx={{ width: 48, height: 36 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#aaa' }}>{r.video_id}</Typography>
              </Box>
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                <IconButton size="small" sx={{ color: '#08cfff' }}>
                  <OpenIcon fontSize="small" />
                </IconButton>
              </a>
            </Box>

            {/* Matching segments */}
            <CardContent sx={{ py: 1.2 }}>
              {(r.matching_segments || []).map((seg, j) => {
                const ts = extractTimestamp(seg);
                const text = cleanSegment(seg);
                const ytUrl = ts ? `${r.url}&t=${ts.seconds}` : r.url;
                return (
                  <Box key={j} sx={{
                    mb: 1,
                    p: 1,
                    background: 'rgba(255,232,93,0.05)',
                    border: '1px solid rgba(255,232,93,0.1)',
                    borderRadius: 2,
                    display: 'flex',
                    gap: 1,
                    alignItems: 'flex-start'
                  }}>
                    {ts && (
                      <a href={ytUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <Chip
                          label={ts.timestamp}
                          size="small"
                          sx={{ bgcolor: 'rgba(8,207,255,0.15)', color: '#08cfff', fontSize: '0.65rem', height: 18, cursor: 'pointer' }}
                        />
                      </a>
                    )}
                    <Typography variant="caption" sx={{ color: '#ccc', lineHeight: 1.6 }}>
                      {highlightMatch(text, query)}
                    </Typography>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {results.length > 0 && (
          <Typography variant="caption" sx={{ color: '#555', display: 'block', textAlign: 'center', pb: 2 }}>
            Found {results.length} video{results.length !== 1 ? 's' : ''} containing "{query}"
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default SubtitleSearch;
