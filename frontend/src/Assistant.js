import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Badge,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  IconButton,
  Avatar,
  Box,
  Container,
  Paper,
  Card,
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  ChatBubbleOutline as ChatIcon,
  Notes as NotesIcon,
  PlaylistPlay as PlaylistIcon,
  CompareArrows as CompareIcon,
  AccountTree as MapIcon,
} from "@mui/icons-material";
import { removeChildData } from "./slice";
import { setOptionValue } from "./chatSlice";
import Notes from "./Notes";
import Playlists from "./Playlists";
import CompareVideos from "./CompareVideos";
import MindMap from "./MindMap";

export const CardItem = ({ item }) => (
  <Card sx={{ background: "#fdfdfd08", color: "white" }}>
    <Box display="flex" padding="10px" gap="10px">
      <img
        src={item.thumbnail}
        alt={item.title}
        style={{ width: "100px", height: "100px" }}
      />
      <Box>
        <Typography
          noWrap
          sx={{
            width: "auto",
            maxWidth: { xs: "180px", sm: "220px", md: "100%" },
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </Typography>
        <Box display="flex" gap="10px" padding="15px 0" alignItems="center">
          <Avatar src={item.channel_thumbnail} sx={{ width: 30, height: 30 }} />
          <Typography variant="body2" sx={{ margin: 0 }}>
            {item.channel_name}
          </Typography>
        </Box>
        <Box display="flex" flexWrap="wrap" gap="15px">
          <Box display="flex" gap="5px" alignItems="center">
            <VisibilityIcon />
            <Typography variant="body2">{item.views}</Typography>
          </Box>
          <Box display="flex" gap="5px" alignItems="center">
            <AccessTimeIcon />
            <Typography variant="body2">{item.duration}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  </Card>
);

function Assistant() {
  const { list } = useSelector((state) => state.data);
  const dispatch = useDispatch();

  // Tab: 0 = Chat Options, 1 = Notes, 2 = Playlists, 3 = Compare, 4 = MindMap
  const [activeTab, setActiveTab] = useState(0);

  const options = [
    {
      text: "Chat with video",
      value: "chat",
      description: "Chat, summarize, and analyze videos",
    },
    {
      text: "Jump to specific content",
      value: "jump",
      description: "Skip directly to the parts of the video you care about",
    },
    {
      text: "Pick the right one",
      value: "pick",
      description:
        "Let AI suggest the best video when you're unsure which to watch",
    },
  ];

  const [selectedOption, setSelectedOption] = useState(options[0].value);

  const handleRemove = (id, item) => {
    const updatedList = [];
    const updatedIndex = [];
    list.map((item) => {
      if (item.id !== id) {
        updatedList.push(item);
        updatedIndex.push(item.id);
      }
    });
    dispatch(removeChildData({ updatedList, updatedIndex }));
  };

  useEffect(() => {
    dispatch(setOptionValue(selectedOption));
  }, [selectedOption]);

  const navTabs = [
    { label: "Chat", icon: <ChatIcon sx={{ fontSize: 18 }} />, title: "Chat options" },
    { label: "Notes", icon: <NotesIcon sx={{ fontSize: 18 }} />, title: "AI Study Notes" },
    { label: "Playlists", icon: <PlaylistIcon sx={{ fontSize: 18 }} />, title: "Save & load playlists" },
    { label: "Compare", icon: <CompareIcon sx={{ fontSize: 18 }} />, title: "Compare videos" },
    { label: "Map", icon: <MapIcon sx={{ fontSize: 18 }} />, title: "Concept mind map" },
  ];

  return (
    <Container
      component={Paper}
      sx={{
        color: "white",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(110deg, rgb(7 28 79) 0%, #009688 100%)",
        paddingY: "0px",
        paddingX: "0px !important",
        maxWidth: "none !important",
      }}
    >
      {/* Tab bar */}
      <Box sx={{
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(8px)',
        flexShrink: 0
      }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          TabScrollButtonProps={{ sx: { color: 'white' } }}
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.5)',
              minHeight: 44,
              fontSize: '0.72rem',
              '&.Mui-selected': { color: 'white' }
            },
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%)',
              height: 2
            }
          }}
        >
          {navTabs.map((t, i) => (
            <Tooltip key={i} title={t.title} placement="bottom">
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {t.icon}
                    <span>{t.label}</span>
                  </Box>
                }
              />
            </Tooltip>
          ))}
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── 0: Chat Options + Video List ─────────────────────────── */}
        {activeTab === 0 && (
          <Box sx={{ height: '100%', overflowY: 'auto', p: 1.5 }}>
            <RadioGroup
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              {options.map((item) => (
                <Card
                  key={item.value}
                  sx={{
                    flex: 1,
                    cursor: "pointer",
                    lineHeight: "20px",
                    padding: "10px",
                    marginBottom: "5px",
                    background: "#ffffff21",
                    color: "white",
                  }}
                >
                  <FormControlLabel
                    value={item.value}
                    control={<Radio style={{ color: "white" }} />}
                    label={item.text}
                  />
                  {selectedOption === item.value && (
                    <Typography pl="32px">{item.description}</Typography>
                  )}
                </Card>
              ))}
            </RadioGroup>

            <Box sx={{ marginTop: "24px" }}>
              <Typography variant="h6">Selected Video(s)</Typography>
              {list.length === 0 && (
                <Typography variant="caption" sx={{ color: '#888', display: 'block', mt: 1, px: 1 }}>
                  Search for videos on the left and add them to your list.
                </Typography>
              )}
              {list.map((item) => (
                <div style={{ margin: "15px 0px" }} key={item.id}>
                  <Badge
                    sx={{ display: "block" }}
                    anchorOrigin={{ vertical: "top", horizontal: "left" }}
                    badgeContent={
                      <IconButton
                        style={{
                          zoom: "0.5",
                          border: "1px solid gray",
                          backgroundColor: "#ffffffc2",
                        }}
                        onClick={() => handleRemove(item.id, item)}
                        size="small"
                      >
                        <CloseIcon />
                      </IconButton>
                    }
                  >
                    <CardItem item={item} />
                  </Badge>
                </div>
              ))}
            </Box>
          </Box>
        )}

        {/* ── 1: AI Study Notes ──────────────────────────────────────── */}
        {activeTab === 1 && <Notes />}

        {/* ── 2: Playlists ───────────────────────────────────────────── */}
        {activeTab === 2 && <Playlists onClose={() => setActiveTab(0)} />}

        {/* ── 3: Compare Videos ──────────────────────────────────────── */}
        {activeTab === 3 && <CompareVideos />}

        {/* ── 4: Mind Map ────────────────────────────────────────────── */}
        {activeTab === 4 && <MindMap />}
      </Box>
    </Container>
  );
}

export default Assistant;
