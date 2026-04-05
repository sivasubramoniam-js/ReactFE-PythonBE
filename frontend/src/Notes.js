import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, Divider,
  CircularProgress, IconButton, Tooltip, Collapse
} from '@mui/material';
import {
  Notes as NotesIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  LightbulbOutlined as LightbulbIcon,
  CheckCircleOutline as CheckIcon,
  AutoAwesome as AIIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

function Notes() {
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const videoData = useSelector(state => state.data);

  const generateNotes = async (forceRefresh = false) => {
    if (!videoData.id || videoData.id.length === 0) {
      setError('Add at least one video to your list to generate notes.');
      return;
    }
    setLoading(true);
    setError(null);
    if (forceRefresh) setNotes(null);
    try {
      const res = await axios.post('/generateNotes', { id: videoData.id });
      setNotes(res.data.notes);
      setExpandedSections({});
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate notes. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (i) =>
    setExpandedSections(prev => ({ ...prev, [i]: !prev[i] }));

  const downloadPDF = () => {
    if (!notes) return;
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 14;
      doc.setFontSize(18);
      doc.setTextColor(10, 36, 99);
      doc.text('Study Notes', 14, y); y += 10;

      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text('TL;DR', 14, y); y += 6;
      doc.setFontSize(10);
      const tldr = doc.splitTextToSize(notes.tldr || '', 180);
      doc.text(tldr, 14, y); y += tldr.length * 6 + 6;

      doc.setFontSize(12);
      doc.setTextColor(10, 36, 99);
      doc.text('Key Concepts', 14, y); y += 6;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      (notes.key_concepts || []).forEach(c => {
        doc.text(`• ${c}`, 16, y); y += 6;
      });
      y += 4;

      (notes.sections || []).forEach(s => {
        doc.setFontSize(12);
        doc.setTextColor(0, 150, 136);
        doc.text(s.heading, 14, y); y += 6;
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        (s.bullets || []).forEach(b => {
          const lines = doc.splitTextToSize(`• ${b}`, 178);
          doc.text(lines, 16, y); y += lines.length * 6;
        });
        y += 4;
        if (y > 270) { doc.addPage(); y = 14; }
      });

      doc.setFontSize(12);
      doc.setTextColor(10, 36, 99);
      doc.text('Key Takeaways', 14, y); y += 6;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      (notes.takeaways || []).forEach(t => {
        const lines = doc.splitTextToSize(`✓ ${t}`, 178);
        doc.text(lines, 16, y); y += lines.length * 6;
      });

      doc.save('study-notes.pdf');
    });
  };

  const sectionColors = ['#2196F3', '#9C27B0', '#00BCD4', '#FF5722', '#4CAF50', '#FF9800'];

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotesIcon sx={{ color: '#08cfff' }} />
          <Typography variant="h6" className="styled-color" sx={{ fontWeight: 'bold' }}>
            AI Study Notes
          </Typography>
        </Box>
        {notes && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Regenerate notes">
              <IconButton size="small" sx={{ color: '#aaa' }} onClick={() => generateNotes(true)}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as PDF">
              <IconButton size="small" sx={{ color: '#ffe85d' }} onClick={downloadPDF}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {!notes && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <AIIcon sx={{ fontSize: 56, color: '#08cfff', opacity: 0.7, mb: 2 }} />
          <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
            Generate AI-powered study notes from your selected video(s). Includes key concepts, structured sections, and actionable takeaways — downloadable as PDF.
          </Typography>
          {error && (
            <Typography sx={{ color: '#ff6b6b', mb: 2, fontSize: '0.85rem' }}>{error}</Typography>
          )}
          <Button
            variant="contained"
            onClick={() => generateNotes()}
            startIcon={<NotesIcon />}
            sx={{
              background: 'linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%)',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '20px',
              px: 4
            }}
          >
            Generate Notes
          </Button>
        </Box>
      )}

      {loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#08cfff', mb: 2 }} />
          <Typography sx={{ color: '#aaa' }}>AI is analyzing the video and generating notes…</Typography>
        </Box>
      )}

      {notes && !loading && (
        <Box>
          {/* TL;DR */}
          <Card sx={{ mb: 2, background: 'rgba(8,207,255,0.08)', border: '1px solid rgba(8,207,255,0.3)', borderRadius: 3 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="overline" sx={{ color: '#08cfff', letterSpacing: 2 }}>TL;DR</Typography>
              <Typography variant="body2" sx={{ color: '#eee', mt: 0.5, lineHeight: 1.7 }}>{notes.tldr}</Typography>
            </CardContent>
          </Card>

          {/* Key Concepts */}
          <Card sx={{ mb: 2, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="overline" sx={{ color: '#ffe85d', letterSpacing: 2 }}>Key Concepts</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {(notes.key_concepts || []).map((c, i) => (
                  <Chip key={i} label={c} size="small"
                    sx={{ background: 'rgba(255,232,93,0.12)', color: '#ffe85d', border: '1px solid rgba(255,232,93,0.3)', fontSize: '0.7rem' }} />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Sections */}
          {(notes.sections || []).map((s, i) => (
            <Card key={i} sx={{
              mb: 1.5,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${sectionColors[i % sectionColors.length]}44`,
              borderLeft: `3px solid ${sectionColors[i % sectionColors.length]}`,
              borderRadius: 2
            }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.2, cursor: 'pointer' }}
                onClick={() => toggleSection(i)}
              >
                <Typography variant="subtitle2" sx={{ color: sectionColors[i % sectionColors.length], fontWeight: 'bold' }}>
                  {s.heading}
                </Typography>
                {expandedSections[i] ? <ExpandLessIcon sx={{ color: '#aaa', fontSize: 18 }} /> : <ExpandMoreIcon sx={{ color: '#aaa', fontSize: 18 }} />}
              </Box>
              <Collapse in={expandedSections[i] !== false}>
                <CardContent sx={{ pt: 0, pb: '12px !important' }}>
                  {(s.bullets || []).map((b, j) => (
                    <Box key={j} sx={{ display: 'flex', gap: 1, mb: 0.8, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: sectionColors[i % sectionColors.length], mt: 0.8, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#ddd', lineHeight: 1.6 }}>{b}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Collapse>
            </Card>
          ))}

          {/* Takeaways */}
          {(notes.takeaways || []).length > 0 && (
            <Card sx={{ mt: 1, background: 'rgba(76,175,80,0.07)', border: '1px solid rgba(76,175,80,0.25)', borderRadius: 3 }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LightbulbIcon sx={{ color: '#4CAF50', fontSize: 18 }} />
                  <Typography variant="overline" sx={{ color: '#4CAF50', letterSpacing: 2 }}>Key Takeaways</Typography>
                </Box>
                {(notes.takeaways || []).map((t, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.8, alignItems: 'flex-start' }}>
                    <CheckIcon sx={{ color: '#4CAF50', fontSize: 16, mt: 0.3, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: '#ddd', lineHeight: 1.6 }}>{t}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          <Button
            fullWidth
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadPDF}
            sx={{ mt: 2, color: '#ffe85d', borderColor: '#ffe85d', borderRadius: 2, '&:hover': { borderColor: '#fff', color: '#fff' } }}
          >
            Download as PDF
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default Notes;
