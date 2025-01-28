import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Box, Typography, Grid, Card, Link } from '@mui/material';
import { addMessage, setInputMessage, clearInputMessage } from './chatSlice';
import axios from 'axios';
import { OpenInNew, Send } from '@mui/icons-material';

export const CardItem = ({type, response}) => {
  const { complete_list:list } = useSelector(state => state.data);
  const isJsonResponse = Boolean(response.json)
  const getItem = (id) => list.filter((data) => data.id == id)

  function secondsToHhMmSs(totalSeconds) {
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format each component to be two digits
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    const paddedString = hours ? `${paddedHours}:${paddedMinutes}:${paddedSeconds}` :  `${paddedMinutes}:${paddedSeconds}`
    // Combine components into hh:mm:ss format
    return paddedString;
}

  return (
    <Box display='flex' flexDirection='column' gap='10px' padding={isJsonResponse ? '10px' : '0px'}>
      {isJsonResponse ? response.json.map((jsonObj, jsonIndex) => (
        <Card sx={{background: "#a4a4a442", color: "white"}}>
          {getItem(jsonObj.id).map((item) => (
            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                <Box padding="10px" gap="10px" alignItems="flex-start">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    style={{ width: "100px", height: "100px", float: "left", marginRight: "10px" }}
                  />
                  <Box>
                    <Typography variant='h6' style={{textDecoration: 'underline', textUnderlineOffset: '5px'}}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                    >
                      {jsonObj.response}
                    </Typography>
                  </Box>
              </Box>
                {type == 'jump' && jsonObj?.info?.length && jsonObj.info.map((info) => (
                  <Box display='flex' gap="10px" alignItems='center' paddingX='10px' paddingY='5px'>
                    <Typography>{secondsToHhMmSs(info.start.split('.')[0])}
                      <Link target="_blank" style={{textDecoration: 'none', color: 'white'}}  href={`https://www.youtube.com/watch?v=${jsonObj.id}&t=${info.start.split('.')[0]}`}><OpenInNew style={{width: '15px', height: '15px', paddingLeft: '5px'}} /></Link>
                    </Typography>
                    <Typography>{info.topic}</Typography>
                    
                  </Box>
                ))}
                </Box>
          ))}
        </Card>
      )):(
        <Card sx={{background: "#a4a4a442", color: "white"}}>
        <Box display="flex" padding="10px" gap="10px">
            <Typography
              sx={{ width: "220px", overflow: "hidden" }}
            >
              {response.content}
            </Typography>
        </Box>
      </Card>
      )}
  </Box>
  )
}

function Chat() {
  const recentChatRef = useRef(null);
  const dispatch = useDispatch();
  const chat = useSelector(state => state.chat);
  const videoData = useSelector(state => state.data);
  const messages = chat.messages;
  const inputMessage = chat.inputMessage;
  const selectedOption = chat.option;

  const prompts = {
    chat: ["Summarize in 100 words", "What is this video about ?", "write any essay", ],
    jump: ["I'm looking for {topic}", "what are the topics mentioned here"],
    pick: ["best video to learn {topic}"]
  }

  const handleSend = () => {
    if (inputMessage.trim()) {
      dispatch(addMessage({ type: 'outgoing', text: inputMessage }));
      axios.post("http://127.0.0.1:5000/chat", {
        option: selectedOption,
        id: videoData.id,
        message: inputMessage
      }).then((res) => {
        const results = res.data.response;
        results.forEach((item) => {
          dispatch(addMessage({ type: 'incoming', response: item, option: selectedOption }));
        })
      })
      dispatch(clearInputMessage());
    }
  };

  useEffect(() => {
    recentChatRef.current.scrollIntoView(true);
  },[messages])

  return (
    <Box className='chat-container' height='100%' padding={"0px 20px"} display="flex" flexDirection="column" gap="20px">
      <Box className='chat-messages' sx={{overflowY: 'auto', flex: 1, border: '1px solid #ddd', borderRadius: 1, maxHeight: 'calc(100vh - 300px)' }}>
        {messages.map((item, index) => (
          <Grid key={index} sx={{ mb: 1, width: "100%", display: "flex", justifyContent: item.type === 'incoming' ? 'start' : 'end'}}>
            <Grid style={{backgroundColor: item.type === 'incoming' ? '#d6d4d421' : '#d1e7dd', maxWidth: "75%", margin: "10px", borderRadius: "10px"}}>
                {item.type === 'incoming' ? (
                  <CardItem type={item.option} response={item.response} />
                ) : (
                  <Typography padding="10px 15px">{item.text}</Typography>
                )}
            </Grid>
          </Grid>
        ))}
        <div ref={recentChatRef}></div>
      </Box>
      <Box display='flex' flexDirection='column' justifyContent='space-between' height='170px'>
        <div style={{color: "white"}}>Prompt Suggestions</div>
        <Box display="flex" gap="10px">
          {prompts[selectedOption] && prompts[chat.option].map((prompt) => (
            <Card onClick={() => dispatch(setInputMessage(prompt))} sx={{flex: 1, cursor: "pointer", lineHeight: "20px", padding: "10px", background: "#ffffff21", color: "white"}}>{prompt}</Card>
          ))}
        </Box>
        <Box className='chat-box' sx={{ display: 'flex', alignItems: 'center', gap: "10px", position: "relative" }}>
          <input
            className='chat-input'
            placeholder='Type message here'
            value={inputMessage}
            style={{ color: "white", flexGrow: 1, marginRight: 1, fontSize: 'medium', outline: "1px solid white", border: "none", padding: "15px", backgroundColor: "transparent", borderRadius: "5px"}}
            onChange={(e) => dispatch(setInputMessage(e.target.value))}
          />
          <Button
            className='yt-search-button yt-chat-button'
            variant='contained'
            onClick={handleSend}
            endIcon={<Send fontSize='small' style={{ clipPath: "polygon(0% 42%, 0% 0%, 90% 50%, 0% 100%, 0% 58%, 70% 50%)", color: "transparent", background: "linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%)"}} />}
            style={{background: "linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%) text"}}
          >
            <span className='styled-color'>Send</span>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default Chat;
