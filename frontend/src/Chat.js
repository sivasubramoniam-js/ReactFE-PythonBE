// Chat.js
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextField, Button, Box, Typography, Paper, Grid } from '@mui/material';
import { addMessage, setInputMessage, clearInputMessage } from './chatSlice';

function Chat() {
  const dispatch = useDispatch();
  const messages = useSelector(state => state.chat.messages);
  const inputMessage = useSelector(state => state.chat.inputMessage);
  console.log(messages)
  console.log(inputMessage)

  const handleSend = () => {
    if (inputMessage.trim()) {
      dispatch(addMessage({ type: 'incoming', text: inputMessage }));
      dispatch(addMessage({ type: 'outgoing', text: inputMessage }));
      dispatch(clearInputMessage());
    }
  };

  return (
    <Box className='chat-container' height="100%" flexGrow={1} padding={"0px 20px"} display="flex" flexDirection="column" justifyContent="space-between" >
      <Box className='chat-messages' sx={{overflowY: 'auto', flex: 1, mb: 2, border: '1px solid #ddd', borderRadius: 1 }}>
        {messages.map((item, index) => (
          <Grid key={index} sx={{ mb: 1, width: "100%", display: "flex", justifyContent: item.type === 'incoming' ? 'start' : 'end'}}>
            <Grid style={{backgroundColor: item.type === 'incoming' ? '#f0f0f0' : '#d1e7dd', width: "auto", margin: "10px", borderRadius: "10px"}}>
                <Typography padding="10px 15px">{item.text}</Typography>
            </Grid>
          </Grid>
        ))}
      </Box>
      <Box className='chat-box' sx={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          className='chat-input'
          variant='outlined'
          size='small'
          value={inputMessage}
          onChange={(e) => dispatch(setInputMessage(e.target.value))}
          sx={{ flexGrow: 1, mr: 1 }}
        />
        <Button
          className='yt-search-button yt-chat-button'
          variant='contained'
          color='primary'
          onClick={handleSend}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}

export default Chat;
