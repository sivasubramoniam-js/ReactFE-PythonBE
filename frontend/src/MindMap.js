import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, CircularProgress, IconButton,
  Tooltip, Chip, Card
} from '@mui/material';
import {
  AccountTree as MapIcon,
  OpenInNew as OpenInNewIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Tree from 'react-d3-tree';

function MindMap() {
  const [mindmap, setMindmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.7);
  const containerRef = useRef(null);
  const videoData = useSelector(state => state.data);

  // Convert our mindmap format to react-d3-tree format
  const convertToD3Format = (node) => {
    if (!node) return null;
    return {
      name: node.root || node.topic || 'Topic',
      attributes: node.start ? { '⏱': node.start } : {},
      children: (node.children || []).map(child => convertToD3Format(child)).filter(Boolean)
    };
  };

  const generate = async (forceRefresh = false) => {
    if (!videoData.id || videoData.id.length === 0) {
      setError('Add at least one video to your list first.');
      return;
    }
    setLoading(true);
    setError(null);
    if (forceRefresh) setMindmap(null);
    try {
      const res = await axios.post('/generateMindMap', { id: videoData.id });
      setMindmap(res.data.mindmap);
      // Center the tree
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setTranslate({ x: width / 2, y: 60 });
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate mind map.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (containerRef.current && mindmap) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 60 });
    }
  }, [mindmap]);

  const handleNodeClick = (node) => {
    const start = node.data?.attributes?.['⏱'];
    if (start && videoData.id?.length > 0) {
      // Convert hh:mm:ss to seconds
      const parts = start.split(':').map(Number);
      let seconds = 0;
      if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
      const url = `https://www.youtube.com/watch?v=${videoData.id[0]}&t=${seconds}`;
      window.open(url, '_blank');
    }
  };

  const nodeColors = ['#08cfff', '#ffe85d', '#ff1827', '#4CAF50', '#9C27B0', '#FF9800'];

  const renderCustomNode = ({ nodeDatum, hierarchyPointNode }) => {
    const depth = hierarchyPointNode.depth;
    const color = nodeColors[depth % nodeColors.length];
    const hasTimestamp = nodeDatum.attributes?.['⏱'];
    const isRoot = depth === 0;
    const r = isRoot ? 20 : depth === 1 ? 14 : 10;

    return (
      <g onClick={() => handleNodeClick({ data: nodeDatum })} style={{ cursor: hasTimestamp ? 'pointer' : 'default' }}>
        <circle
          r={r}
          fill={color}
          fillOpacity={isRoot ? 1 : 0.25}
          stroke={color}
          strokeWidth={isRoot ? 0 : 2}
        />
        {hasTimestamp && (
          <circle r={r + 4} fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
        )}
        <text
          x={r + 6}
          y={0}
          dominantBaseline="middle"
          style={{
            fill: isRoot ? color : '#eee',
            fontSize: isRoot ? '14px' : depth === 1 ? '12px' : '10px',
            fontWeight: isRoot ? '700' : '500',
            fontFamily: 'Josefin Sans, sans-serif'
          }}
        >
          {nodeDatum.name.length > 30 ? nodeDatum.name.slice(0, 30) + '…' : nodeDatum.name}
        </text>
        {hasTimestamp && (
          <text
            x={r + 6}
            y={14}
            style={{ fill: '#888', fontSize: '9px', fontFamily: 'monospace' }}
          >
            ⏱ {nodeDatum.attributes['⏱']}
          </text>
        )}
      </g>
    );
  };

  const d3Data = mindmap ? convertToD3Format(mindmap) : null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MapIcon sx={{ color: '#08cfff' }} />
          <Typography variant="h6" className="styled-color" sx={{ fontWeight: 'bold' }}>Concept Mind Map</Typography>
        </Box>
        {mindmap && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Zoom in"><IconButton size="small" sx={{ color: '#aaa' }} onClick={() => setZoom(z => Math.min(z + 0.1, 2))}><ZoomInIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Zoom out"><IconButton size="small" sx={{ color: '#aaa' }} onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))}><ZoomOutIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Regenerate"><IconButton size="small" sx={{ color: '#aaa' }} onClick={() => generate(true)}><RefreshIcon fontSize="small" /></IconButton></Tooltip>
          </Box>
        )}
      </Box>

      {!mindmap && !loading && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <MapIcon sx={{ fontSize: 64, color: '#08cfff', opacity: 0.5, mb: 2 }} />
          <Typography variant="body2" sx={{ color: '#aaa', textAlign: 'center', mb: 3, maxWidth: 300 }}>
            Visualize the concepts of your selected video as an interactive mind map. Click any node with a ⏱ timestamp to jump to that moment in YouTube.
          </Typography>
          {error && <Typography sx={{ color: '#ff6b6b', mb: 2, fontSize: '0.85rem', textAlign: 'center' }}>{error}</Typography>}
          <Button
            variant="contained"
            onClick={() => generate()}
            startIcon={<MapIcon />}
            sx={{
              background: 'linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%)',
              color: '#000', fontWeight: 'bold', borderRadius: '20px', px: 4
            }}
          >
            Generate Mind Map
          </Button>
        </Box>
      )}

      {loading && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CircularProgress sx={{ color: '#08cfff' }} />
          <Typography sx={{ color: '#aaa' }}>AI is mapping the concepts…</Typography>
        </Box>
      )}

      {mindmap && !loading && (
        <>
          <Typography variant="caption" sx={{ color: '#888', px: 2, pb: 1 }}>
            💡 Nodes with ⏱ are clickable — they open that moment in YouTube
          </Typography>
          <Box
            ref={containerRef}
            sx={{
              flex: 1,
              bgcolor: 'rgba(0,0,0,0.2)',
              mx: 2,
              mb: 2,
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {d3Data && (
              <Tree
                data={d3Data}
                translate={translate}
                zoom={zoom}
                orientation="horizontal"
                pathFunc="elbow"
                separation={{ siblings: 1.2, nonSiblings: 1.8 }}
                renderCustomNodeElement={renderCustomNode}
                pathClassFunc={() => 'mindmap-path'}
                onNodeClick={handleNodeClick}
                svgProps={{
                  style: { background: 'transparent' }
                }}
              />
            )}
          </Box>
          <style>{`
            .mindmap-path { stroke: rgba(255,255,255,0.2); stroke-width: 1.5; fill: none; }
            .rd3t-link { stroke: rgba(8,207,255,0.25) !important; stroke-width: 1.5 !important; }
          `}</style>
        </>
      )}
    </Box>
  );
}

export default MindMap;
