import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, CircularProgress, Button,
  Chip, Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Tooltip
} from '@mui/material';
import {
  CompareArrows as CompareIcon,
  CheckCircle as CheckIcon,
  Cancel as CrossIcon,
  OpenInNew as OpenIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const DEPTH_COLOR = { shallow: '#08cfff', moderate: '#ffe85d', deep: '#4CAF50' };
const PACE_COLOR = { slow: '#4CAF50', medium: '#ffe85d', fast: '#f44336' };
const AUDIENCE_COLOR = { beginner: '#2196F3', intermediate: '#FF9800', advanced: '#f44336' };

function CompareVideos() {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const videoData = useSelector(state => state.data);

  const doCompare = async () => {
    if (!videoData.id || videoData.id.length < 2) {
      setError('Add at least 2 videos to your list to compare them.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/compareVideos', { ids: videoData.id });
      setComparison(res.data.comparison);
    } catch (e) {
      setError(e.response?.data?.error || 'Comparison failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVideoMeta = (id) => videoData.complete_list.find(v => v.id === id);

  const ColorBadge = ({ val, colorMap }) => {
    const color = colorMap?.[val?.toLowerCase()] || '#888';
    return (
      <Chip label={val} size="small" sx={{
        bgcolor: `${color}22`,
        color: color,
        border: `1px solid ${color}44`,
        fontSize: '0.65rem',
        height: 20
      }} />
    );
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareIcon sx={{ color: '#08cfff' }} />
          <Typography variant="h6" className="styled-color" sx={{ fontWeight: 'bold' }}>
            Video Comparison
          </Typography>
        </Box>
        {comparison && (
          <Tooltip title="Recompare">
            <Button size="small" sx={{ color: '#aaa' }} startIcon={<RefreshIcon />} onClick={doCompare}>Refresh</Button>
          </Tooltip>
        )}
      </Box>

      {!comparison && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CompareIcon sx={{ fontSize: 64, color: '#08cfff', opacity: 0.5, mb: 2 }} />
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1, maxWidth: 320, mx: 'auto' }}>
            Add 2+ videos to your list, then get a detailed AI comparison — topics, depth, pace, audience, and a recommendation.
          </Typography>
          <Typography variant="caption" sx={{ color: '#888', mb: 3, display: 'block' }}>
            Videos in list: {videoData.id?.length || 0}
          </Typography>
          {error && <Typography sx={{ color: '#ff6b6b', mb: 2, fontSize: '0.85rem' }}>{error}</Typography>}
          <Button
            variant="contained"
            onClick={doCompare}
            startIcon={<CompareIcon />}
            disabled={videoData.id?.length < 2}
            sx={{
              background: videoData.id?.length >= 2
                ? 'linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%)'
                : 'rgba(255,255,255,0.1)',
              color: videoData.id?.length >= 2 ? '#000' : '#555',
              fontWeight: 'bold', borderRadius: '20px', px: 4
            }}
          >
            Compare Videos
          </Button>
        </Box>
      )}

      {loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#08cfff', mb: 2 }} />
          <Typography sx={{ color: '#aaa' }}>AI is analyzing and comparing your videos…</Typography>
        </Box>
      )}

      {comparison && !loading && (
        <Box>
          {/* AI Recommendation */}
          <Card sx={{ mb: 3, background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 3 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="overline" sx={{ color: '#4CAF50', letterSpacing: 2 }}>🤖 AI Recommendation</Typography>
              <Typography variant="body2" sx={{ color: '#eee', mt: 0.5, lineHeight: 1.8 }}>
                {comparison.recommendation}
              </Typography>
            </CardContent>
          </Card>

          {/* Common Topics */}
          {(comparison.common_topics || []).length > 0 && (
            <Card sx={{ mb: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, p: 2 }}>
              <Typography variant="overline" sx={{ color: '#08cfff', letterSpacing: 2, display: 'block', mb: 1 }}>Common Topics</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {(comparison.common_topics || []).map((t, i) => (
                  <Chip key={i} label={t} size="small"
                    sx={{ bgcolor: 'rgba(8,207,255,0.1)', color: '#08cfff', fontSize: '0.7rem', border: '1px solid rgba(8,207,255,0.25)' }} />
                ))}
              </Box>
            </Card>
          )}

          {/* Comparison Matrix Table */}
          <Typography variant="overline" sx={{ color: '#aaa', letterSpacing: 2, mb: 1, display: 'block' }}>
            Comparison Matrix
          </Typography>
          <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.04)', borderRadius: 3, mb: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#888', borderColor: 'rgba(255,255,255,0.08)', fontWeight: 'bold' }}>Attribute</TableCell>
                  {(comparison.videos || []).map((v, i) => {
                    const meta = getVideoMeta(v.id);
                    return (
                      <TableCell key={i} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.08)', textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          {meta?.thumbnail && (
                            <img src={meta.thumbnail} alt="" style={{ width: 48, height: 34, borderRadius: 4, objectFit: 'cover' }} />
                          )}
                          <Typography variant="caption" sx={{ color: '#ccc', maxWidth: 80, textAlign: 'center', lineHeight: 1.3 }} noWrap>
                            {meta?.title?.substring(0, 25) || `Video ${i + 1}`}
                          </Typography>
                          {meta && (
                            <a href={meta.url} target="_blank" rel="noopener noreferrer">
                              <OpenIcon sx={{ fontSize: 12, color: '#08cfff' }} />
                            </a>
                          )}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { label: 'Depth', key: 'depth', colorMap: DEPTH_COLOR },
                  { label: 'Pace', key: 'pace', colorMap: PACE_COLOR },
                  { label: 'Audience', key: 'audience', colorMap: AUDIENCE_COLOR },
                  { label: 'Style', key: 'style', colorMap: null },
                ].map(row => (
                  <TableRow key={row.label}>
                    <TableCell sx={{ color: '#aaa', borderColor: 'rgba(255,255,255,0.06)', fontSize: '0.75rem' }}>{row.label}</TableCell>
                    {(comparison.videos || []).map((v, i) => (
                      <TableCell key={i} sx={{ borderColor: 'rgba(255,255,255,0.06)', textAlign: 'center' }}>
                        <ColorBadge val={v[row.key]} colorMap={row.colorMap} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {/* Topics row */}
                <TableRow>
                  <TableCell sx={{ color: '#aaa', borderColor: 'rgba(255,255,255,0.06)', fontSize: '0.75rem', verticalAlign: 'top' }}>Topics</TableCell>
                  {(comparison.videos || []).map((v, i) => (
                    <TableCell key={i} sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                        {(v.topics || []).slice(0, 4).map((t, j) => (
                          <Chip key={j} label={t} size="small"
                            sx={{ fontSize: '0.55rem', height: 16, bgcolor: 'rgba(255,255,255,0.08)', color: '#ccc' }} />
                        ))}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>

                {/* Pros */}
                <TableRow>
                  <TableCell sx={{ color: '#4CAF50', borderColor: 'rgba(255,255,255,0.06)', fontSize: '0.75rem', verticalAlign: 'top' }}>Pros</TableCell>
                  {(comparison.videos || []).map((v, i) => (
                    <TableCell key={i} sx={{ borderColor: 'rgba(255,255,255,0.06)', verticalAlign: 'top' }}>
                      {(v.pros || []).map((p, j) => (
                        <Box key={j} sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start', mb: 0.4 }}>
                          <CheckIcon sx={{ color: '#4CAF50', fontSize: 12, mt: 0.2, flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ color: '#aaa', lineHeight: 1.4 }}>{p}</Typography>
                        </Box>
                      ))}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Cons */}
                <TableRow>
                  <TableCell sx={{ color: '#f44336', borderColor: 'rgba(255,255,255,0.06)', fontSize: '0.75rem', verticalAlign: 'top' }}>Cons</TableCell>
                  {(comparison.videos || []).map((v, i) => (
                    <TableCell key={i} sx={{ borderColor: 'rgba(255,255,255,0.06)', verticalAlign: 'top' }}>
                      {(v.cons || []).map((c, j) => (
                        <Box key={j} sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start', mb: 0.4 }}>
                          <CrossIcon sx={{ color: '#f44336', fontSize: 12, mt: 0.2, flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ color: '#aaa', lineHeight: 1.4 }}>{c}</Typography>
                        </Box>
                      ))}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Unique topics per video */}
          {comparison.unique_to_each && Object.keys(comparison.unique_to_each).length > 0 && (
            <>
              <Typography variant="overline" sx={{ color: '#aaa', letterSpacing: 2, mb: 1, display: 'block' }}>
                Unique to Each Video
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {Object.entries(comparison.unique_to_each).map(([vidId, topics], i) => {
                  const meta = getVideoMeta(vidId);
                  return (
                    <Card key={i} sx={{ flex: 1, minWidth: 140, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, p: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#08cfff', fontWeight: 'bold', display: 'block', mb: 1 }} noWrap>
                        {meta?.title?.substring(0, 20) || `Video ${i + 1}`}
                      </Typography>
                      {(topics || []).map((t, j) => (
                        <Typography key={j} variant="caption" sx={{ color: '#bbb', display: 'block', mb: 0.3 }}>• {t}</Typography>
                      ))}
                    </Card>
                  );
                })}
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

export default CompareVideos;
