import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, TextField,
  IconButton, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, Tooltip
} from '@mui/material';
import {
  PlaylistAdd as PlaylistAddIcon,
  PlaylistPlay as PlaylistPlayIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  FolderOpen as FolderIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { updateChildData } from './slice';

function Playlists({ onClose }) {
  const [playlists, setPlaylists] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const videoData = useSelector(state => state.data);
  const dispatch = useDispatch();

  useEffect(() => {
    loadPlaylists();
    // Also load persisted playlists from localStorage as fallback
    try {
      const stored = JSON.parse(localStorage.getItem('yt_playlists') || '[]');
      if (stored.length) setPlaylists(stored);
    } catch {}
  }, []);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/getPlaylists');
      const serverPlaylists = res.data.playlists || [];
      setPlaylists(serverPlaylists);
      localStorage.setItem('yt_playlists', JSON.stringify(serverPlaylists));
    } catch {
      // Fallback to localStorage
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentList = async () => {
    if (!newName.trim()) {
      setSnack({ open: true, msg: 'Please enter a playlist name', severity: 'warning' });
      return;
    }
    if (!videoData.list || videoData.list.length === 0) {
      setSnack({ open: true, msg: 'Add some videos to your list first', severity: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post('/createPlaylist', {
        name: newName.trim(),
        videos: videoData.list
      });
      const newPlaylist = {
        playlist_id: res.data.playlist_id,
        name: res.data.name,
        videos: videoData.list,
        created_at: new Date().toISOString()
      };
      const updated = [newPlaylist, ...playlists];
      setPlaylists(updated);
      localStorage.setItem('yt_playlists', JSON.stringify(updated));
      setNewName('');
      setSnack({ open: true, msg: `Playlist "${newName}" saved!`, severity: 'success' });
    } catch {
      // Save to localStorage as fallback
      const localPlaylist = {
        playlist_id: Date.now().toString(),
        name: newName.trim(),
        videos: videoData.list,
        created_at: new Date().toISOString()
      };
      const updated = [localPlaylist, ...playlists];
      setPlaylists(updated);
      localStorage.setItem('yt_playlists', JSON.stringify(updated));
      setNewName('');
      setSnack({ open: true, msg: `Playlist "${newName}" saved locally!`, severity: 'success' });
    } finally {
      setSaving(false);
    }
  };

  const loadPlaylist = (playlist) => {
    playlist.videos.forEach(video => {
      if (!videoData.id.includes(video.id)) {
        dispatch(updateChildData({ id: video.id, data: video }));
      }
    });
    setSnack({ open: true, msg: `Loaded "${playlist.name}"`, severity: 'success' });
    if (onClose) onClose();
  };

  const deletePlaylist = async (playlistId) => {
    try {
      await axios.delete(`/deletePlaylist/${playlistId}`);
    } catch {}
    const updated = playlists.filter(p => p.playlist_id !== playlistId);
    setPlaylists(updated);
    localStorage.setItem('yt_playlists', JSON.stringify(updated));
    setSnack({ open: true, msg: 'Playlist deleted', severity: 'info' });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <PlaylistPlayIcon sx={{ color: '#08cfff' }} />
        <Typography variant="h6" className="styled-color" sx={{ fontWeight: 'bold' }}>Playlists</Typography>
      </Box>

      {/* Save current list */}
      <Card sx={{ mb: 2.5, background: 'rgba(8, 207, 255, 0.07)', border: '1px solid rgba(8,207,255,0.2)', borderRadius: 3 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mb: 1 }}>
            Save current video list ({videoData.list?.length || 0} videos)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Playlist name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveCurrentList()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                  '& input::placeholder': { color: '#888' }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={saveCurrentList}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}
              sx={{
                background: 'linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%)',
                color: '#000', fontWeight: 'bold', whiteSpace: 'nowrap'
              }}
            >
              Save
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Saved playlists */}
      <Typography variant="overline" sx={{ color: '#888', letterSpacing: 2, mb: 1, display: 'block' }}>
        Saved Playlists
      </Typography>

      {loading && <Box sx={{ textAlign: 'center', py: 2 }}><CircularProgress size={24} sx={{ color: '#08cfff' }} /></Box>}

      {!loading && playlists.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <FolderIcon sx={{ fontSize: 48, color: '#444', mb: 1 }} />
          <Typography variant="body2" sx={{ color: '#666' }}>No saved playlists yet</Typography>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {playlists.map((pl, i) => (
          <Card key={pl.playlist_id || i} sx={{
            mb: 1.5,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 2,
          }}>
            <CardContent sx={{ py: 1.2, '&:last-child': { pb: 1.2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }} noWrap>
                    {pl.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.4 }}>
                    <Chip label={`${pl.videos?.length || 0} videos`} size="small"
                      sx={{ fontSize: '0.6rem', height: 18, bgcolor: 'rgba(8,207,255,0.12)', color: '#08cfff' }} />
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {pl.created_at?.split('T')[0] || ''}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Load playlist">
                    <IconButton size="small" sx={{ color: '#08cfff' }} onClick={() => loadPlaylist(pl)}>
                      <PlaylistPlayIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" sx={{ color: '#f44336' }} onClick={() => deletePlaylist(pl.playlist_id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Playlists;
