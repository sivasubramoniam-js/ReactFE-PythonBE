import "./App.css";
import Header from "./Header";
import Editor from "./Editor";
import { Box, Drawer } from "@mui/material";
import { useRef, useState } from "react";
import ChatInterface from "./ChatInterface";
import Main from "./Main";
import WordMeaningFinder from "./Finder";

function App() {
  const [selectedText, setSelectedText] = useState("");
  const [selectedRange, setSelectedRange] = useState({
    start: 0,
    end: 0,
    length: 0,
  });

  const [open, setOpen] = useState(false);

  const handleDrawer = (status) => {
    setOpen(status);
  };

  const quillRef = useRef(null);
  const handleSelection = (selectedText, range) => {
    setSelectedText(selectedText);
    setSelectedRange({
      start: range.start,
      length: range.len,
      end: range.start + range.len,
    });
  };
  const [cursorPosition, setCursorPosition] = useState(0);
  return (
    <div className="App">
      <Header handleDrawerOpen={handleDrawer} />
      <Box sx={{ display: "flex" }}>
        <Main open={open} sx={{p:1}}>
          <Editor
            handleSelection={handleSelection}
            selection={{ text: selectedText, range: selectedRange }}
            editorRef={quillRef}
            setCursorPosition={setCursorPosition}
          />
          <WordMeaningFinder />
        </Main>
        <Drawer
          sx={{
            width: "35vw",
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              // backgroundColor: "transparent",
              marginTop: "70px",
              width: "35vw",
              boxShadow:
                "0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)",
            },
          }}
          variant="persistent"
          anchor="right"
          open={open}
        >
          <ChatInterface quillRef={quillRef} cursorPosition={cursorPosition} />
        </Drawer>
      </Box>
    </div>
  );
}

export default App;
