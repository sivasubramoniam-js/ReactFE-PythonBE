import { useState } from "react";
import { Box, TextField, Button, Typography, Paper, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

const WordMeaningFinder = () => {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [error, setError] = useState("");

  const handleFindMeaning = async () => {
    if (!word.trim()) return;

    try {
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const definition = response.data[0]?.meanings[0]?.definitions[0]?.definition;
      setMeaning(definition || "No definition found.");
      setError("");
    } catch (err) {
      setMeaning("");
      setError("Word not found. Please try another word.");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", width: "50%", alignItems: "center" }}>
      <TextField
        fullWidth
        label="Find meaning of a word here"
        variant="outlined"
        value={word}
        autoComplete="off"
        onChange={(e) => setWord(e.target.value)}
        sx={{ mb: 2 }}
      />
      <IconButton onClick={handleFindMeaning} sx={{ mb: 2 }}>
        <SearchIcon />
      </IconButton>
        </Box>

      {(meaning || error) && (
        <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
          {meaning && <Typography><strong>Meaning:</strong> {meaning}</Typography>}
          {error && <Typography color="error">{error}</Typography>}
        </Paper>
      )}
    </Box>
  );
};

export default WordMeaningFinder;
