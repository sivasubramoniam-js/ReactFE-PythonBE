import { useState, useEffect } from "react";
import { Box, Tabs, Tab, TextField, Button, Typography, Paper, Select, MenuItem, FormControl, Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import SendIcon from "@mui/icons-material/Send";
import axiosInstance from "./axiosInstance";
import parse from 'html-react-parser';

const ChatInterface = ({ quillRef, cursorPosition }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axiosInstance.get("/languages");
        setLanguages(response.data);
      } catch (error) {
        console.error("Error fetching languages:", error);
      }
    };
    fetchLanguages();
    // window.Quill = quillRef.current.editor;
  }, []);

  const handleTabChange = (_, newIndex) => setTabIndex(newIndex);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const apiEndpoint = tabIndex === 0 ? "/translate" : "/chat";
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await axiosInstance.post(apiEndpoint, {
        message: input,
        language: tabIndex === 0 ? selectedLanguage : undefined,
      });
      console.log(response);
      const botMessage = { sender: "bot", text: response.data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("API error:", error);
      const errorMessage = { sender: "bot", text: "Error connecting to the server." };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setInput("");
  };

  return (
    <Box sx={{ p: 2 }}>
        {/* <Typography variant="h6" sx={{ mb: 2 }}>Text Enhancer</Typography> */}
      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ width: "100%" }}>
        <Tab label="Translate" className="styled-text" style={{ flex: 1 }} />
        <Tab label="Chat" className="styled-text" style={{ flex: 1 }} />
      </Tabs>

      {tabIndex === 0 ? (
        <FormControl fullWidth sx={{ my: 2 }}>
            <Typography variant="p" sx={{ mb: 2, textAlign: 'start' }}>Choose the preferred language</Typography>
          <Select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            {languages.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <FormControl fullWidth sx={{ my: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
            <Typography variant="p" sx={{ mb: 2, textAlign: 'start' }}>Enter Gemini API Key</Typography>
            <Tooltip title="Get your API key from https://www.geminiapi.com/">
                <InfoIcon style={{ color: 'lightgray' }} />
            </Tooltip>
            </Box>
            <TextField variant="outlined" placeholder="Type your message..." type="password" autoComplete="false" />
        </FormControl>
      )}

      <Paper elevation={3} sx={{ height: "45vh", p: 2, overflowY: "auto", mt: 2 }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              textAlign: msg.sender === "user" ? "right" : "left",
              mb: 1,
            }}
          >
            <Typography
              sx={{
                display: "inline-block",
                p: 1.5,
                borderRadius: 2,
                backgroundColor: msg.sender === "user" ? "#4CAF50" : "#2196F3",
                color: "#fff",
                maxWidth: "75%",
              }}
            >
              {parse(msg.text)}
              {/* {msg.text} */}
            </Typography>
            <br />
            {msg.sender === "bot" && <Button sx={{ textTransform: 'capitalize' }} onClick={() => {
                const editor = quillRef.current.getEditor();
                console.log(editor.getLength());
                console.log(cursorPosition);
                editor.clipboard.dangerouslyPasteHTML(cursorPosition, msg.text);
            }}>+ Append to Editor</Button>}
          </Box>
        ))}
        <div ref={(el) => el && el.scrollIntoView({ behavior: "smooth" })} />
      </Paper>

      <Box sx={{ display: "flex", mt: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          sx={{ ml: 1 }}
          onClick={handleSendMessage}
        >
          <SendIcon />
        </Button>
      </Box>
    </Box>
  );
};

export default ChatInterface;
