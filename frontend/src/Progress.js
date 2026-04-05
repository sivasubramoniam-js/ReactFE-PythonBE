import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  CircularProgress, Chip, Avatar, LinearProgress, Select,
  MenuItem, FormControl, InputLabel, Grid, Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  LocalFireDepartment as FireIcon,
  BarChart as ChartIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';

function Progress() {
  const [userName, setUserName] = useState(() => localStorage.getItem('yt_user_name') || '');
  const [inputName, setInputName] = useState('');
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userName) loadProgress(userName);
  }, [userName]);

  const loadProgress = async (name) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/getUserProgress?user=${encodeURIComponent(name)}`);
      setProgress(res.data.progress || []);
      setStats(res.data.stats || null);
    } catch (e) {
      setError('Failed to load progress data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetUser = () => {
    if (!inputName.trim()) return;
    localStorage.setItem('yt_user_name', inputName.trim());
    setUserName(inputName.trim());
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#f44336';
  };

  const getLevelChipColor = (level) => {
    const colors = { beginner: '#2196F3', intermediate: '#FF9800', expert: '#f44336' };
    return colors[level] || '#888';
  };

  // Group progress by date for streak calculation
  const getStreakDays = () => {
    if (!progress.length) return 0;
    const dates = [...new Set(progress.map(p => p.taken_at?.split(' ')[0]))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let current = today;
    for (const d of dates) {
      if (d === current) {
        streak++;
        const prev = new Date(current);
        prev.setDate(prev.getDate() - 1);
        current = prev.toISOString().split('T')[0];
      } else break;
    }
    return streak;
  };

  if (!userName) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 3, p: 4 }}>
        <SchoolIcon sx={{ fontSize: 72, color: '#08cfff', opacity: 0.7 }} />
        <Typography variant="h5" className="styled-color" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          Your Learning Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: '#aaa', textAlign: 'center', maxWidth: 300 }}>
          Track your quiz scores, learning streaks, and improvement over time.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', maxWidth: 360 }}>
          <TextField
            fullWidth
            placeholder="Enter your name"
            value={inputName}
            onChange={e => setInputName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSetUser()}
            sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
            InputProps={{ style: { color: 'white' } }}
          />
          <Button
            variant="contained"
            onClick={handleSetUser}
            startIcon={<SearchIcon />}
            sx={{
              background: 'linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%)',
              color: '#000', fontWeight: 'bold', whiteSpace: 'nowrap'
            }}
          >
            Load
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon sx={{ color: '#08cfff' }} />
            <Typography variant="h6" className="styled-color" sx={{ fontWeight: 'bold' }}>Learning Dashboard</Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#aaa' }}>Viewing as: {userName}</Typography>
        </Box>
        <Button size="small" sx={{ color: '#aaa' }} onClick={() => { setUserName(''); localStorage.removeItem('yt_user_name'); }}>
          Switch
        </Button>
      </Box>

      {loading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress sx={{ color: '#08cfff' }} /></Box>}
      {error && <Typography sx={{ color: '#f44336', mb: 2 }}>{error}</Typography>}

      {!loading && stats && (
        <>
          {/* Stats Cards */}
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            {[
              { label: 'Total Quizzes', value: stats.total_quizzes, icon: <SchoolIcon />, color: '#08cfff' },
              { label: 'Avg Score', value: `${stats.avg_score}%`, icon: <ChartIcon />, color: '#ffe85d' },
              { label: 'Best Score', value: `${stats.best_score}%`, icon: <TrophyIcon />, color: '#4CAF50' },
              { label: 'Day Streak', value: getStreakDays(), icon: <FireIcon />, color: '#FF5722' }
            ].map((item, i) => (
              <Grid item xs={6} key={i}>
                <Card sx={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${item.color}33`,
                  borderRadius: 3,
                  p: 1.5,
                  textAlign: 'center'
                }}>
                  <Box sx={{ color: item.color, display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                    {React.cloneElement(item.icon, { sx: { fontSize: 22, color: item.color } })}
                  </Box>
                  <Typography variant="h5" sx={{ color: item.color, fontWeight: 'bold' }}>{item.value}</Typography>
                  <Typography variant="caption" sx={{ color: '#aaa' }}>{item.label}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Average Score Bar */}
          {stats.total_quizzes > 0 && (
            <Card sx={{ mb: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, p: 2 }}>
              <Typography variant="overline" sx={{ color: '#aaa', letterSpacing: 2 }}>Overall Performance</Typography>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#aaa' }}>Average Score</Typography>
                  <Typography variant="caption" sx={{ color: getScoreColor(stats.avg_score), fontWeight: 'bold' }}>{stats.avg_score}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.avg_score}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${getScoreColor(stats.avg_score)}, #fff)`, borderRadius: 5 }
                  }}
                />
              </Box>
            </Card>
          )}

          {/* Recent Activity */}
          <Typography variant="overline" sx={{ color: '#aaa', letterSpacing: 2, mb: 1, display: 'block' }}>
            Recent Activity
          </Typography>

          {progress.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#aaa' }}>No quiz attempts yet. Take a quiz to track your progress!</Typography>
            </Box>
          )}

          {progress.map((p, i) => (
            <Card key={i} sx={{
              mb: 1.5,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: `3px solid ${getScoreColor(p.score)}`,
              borderRadius: 2
            }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar src={p.video_thumbnail} variant="rounded" sx={{ width: 42, height: 42 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: '#ddd', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.video_title || p.video_id}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.8, mt: 0.5, alignItems: 'center' }}>
                      <Chip
                        label={p.level}
                        size="small"
                        sx={{ fontSize: '0.6rem', height: 18, bgcolor: `${getLevelChipColor(p.level)}22`, color: getLevelChipColor(p.level), border: `1px solid ${getLevelChipColor(p.level)}44` }}
                      />
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {p.taken_at?.split(' ')[0]}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ color: getScoreColor(p.score), fontWeight: 'bold', lineHeight: 1 }}>
                      {p.score}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </Box>
  );
}

export default Progress;
