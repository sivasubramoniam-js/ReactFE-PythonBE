import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Box, Typography, Grid, Card, Link, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { addMessage, setInputMessage, clearInputMessage } from './chatSlice';
import axios from 'axios';
import { OpenInNew, Send, Mic, MicOff, VolumeUp, VolumeOff } from '@mui/icons-material';

export const CardItem = ({type, response}) => {
  const { complete_list:list } = useSelector(state => state.data);
  const isJsonResponse = Boolean(response.json)
  const getItem = (id) => list.filter((data) => data.id == id)

  function secondsToHhMmSs(timeFrame) {
    const [hours, minutes, seconds] = timeFrame.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const paddedString = totalSeconds.toString().padStart(2, '0');
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
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant='h6' sx={{ textDecoration: 'underline', textUnderlineOffset: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {item.title}
                    </Typography>
                    <Typography sx={{ wordBreak: 'break-word' }}>
                      {jsonObj.response}
                    </Typography>
                  </Box>
              </Box>
                {type == 'jump' && jsonObj?.info?.length && jsonObj.info.map((info) => (
                  <Box display='flex' gap="10px" alignItems='center' paddingX='10px' paddingY='5px'>
                    <Typography>{info.start}
                      <Link target="_blank" style={{textDecoration: 'none', color: 'white'}}  href={`https://www.youtube.com/watch?v=${jsonObj.id}&t=${secondsToHhMmSs(info.start.split('.')[0])}`}><OpenInNew style={{width: '15px', height: '15px', paddingLeft: '5px'}} /></Link>
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
              sx={{ width: "100%", wordBreak: "break-word" }}
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

  // ── FEATURE 2: Voice Chat ──────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const recognitionRef = useRef(null);

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      dispatch(setInputMessage(transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    if (!ttsEnabled || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };
  // ──────────────────────────────────────────────────────────────────────────

  const prompts = {
    chat: ["Summarize in 100 words", "What is this video about ?", "write any essay"],
    jump: ["I'm looking for {topic}", "what are the topics mentioned here"],
    pick: ["best video to learn {topic}"]
  }

  const handleSend = () => {
    if (inputMessage.trim()) {
      dispatch(addMessage({ type: 'outgoing', text: inputMessage }));
      setIsAiTyping(true);
      axios.post("/chat", {
        option: selectedOption,
        id: videoData.id,
        message: inputMessage
      }).then((res) => {
        const results = res.data.response;
        results.forEach((item) => {
          dispatch(addMessage({ type: 'incoming', response: item, option: selectedOption }));
          // TTS: read out plain text responses
          if (ttsEnabled && item.content && !item.json) {
            speakText(item.content.slice(0, 300));
          }
        });
      }).finally(() => setIsAiTyping(false));
      dispatch(clearInputMessage());
    }
  };

  useEffect(() => {
    recentChatRef.current.scrollIntoView(true);
  },[messages])

  return (
    <Box className='chat-container' height='100%' padding={{ xs: "0px 10px", md: "0px 20px" }} display="flex" flexDirection="column" gap="20px">
      <Box className='chat-messages' sx={{overflowY: 'auto', flex: 1, border: '1px solid #ddd', borderRadius: 1, maxHeight: { xs: '400px', md: 'calc(100vh - 300px)' } }}>
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
        {isAiTyping && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
            <CircularProgress size={14} sx={{ color: '#08cfff' }} />
            <Typography variant="caption" sx={{ color: '#aaa' }}>AI is thinking…</Typography>
          </Box>
        )}
        <div ref={recentChatRef}></div>
      </Box>
      <Box display='flex' flexDirection='column' justifyContent='space-between' height='170px'>
        <div style={{color: "white"}}>Prompt Suggestions</div>
        <Box display="flex" gap="10px" sx={{ overflowX: 'auto', pb: 1 }}>
          {prompts[selectedOption] && prompts[chat.option].map((prompt) => (
            <Card onClick={() => dispatch(setInputMessage(prompt))} sx={{flex: '0 0 auto', maxWidth: '200px', cursor: "pointer", lineHeight: "20px", padding: "10px", background: "#ffffff21", color: "white"}}>{prompt}</Card>
          ))}
        </Box>
        <Box className='chat-box' sx={{ display: 'flex', alignItems: 'center', gap: "10px", position: "relative" }}>
          {/* Voice input button */}
          <Tooltip title={isListening ? "Stop listening" : "Voice input"}>
            <IconButton
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              sx={{
                color: isListening ? '#ff1827' : '#aaa',
                border: isListening ? '1px solid #ff1827' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: 38, height: 38,
                animation: isListening ? 'pulse 1s ease-in-out infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,24,39,0.4)' },
                  '50%': { boxShadow: '0 0 0 8px rgba(255,24,39,0)' }
                }
              }}
            >
              {isListening ? <MicOff fontSize="small" /> : <Mic fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* TTS toggle */}
          <Tooltip title={ttsEnabled ? "Mute AI voice" : "Enable AI voice readback"}>
            <IconButton
              onClick={() => { setTtsEnabled(!ttsEnabled); window.speechSynthesis.cancel(); }}
              sx={{
                color: ttsEnabled ? '#08cfff' : '#555',
                border: `1px solid ${ttsEnabled ? '#08cfff' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '50%',
                width: 38, height: 38
              }}
            >
              {ttsEnabled ? <VolumeUp fontSize="small" /> : <VolumeOff fontSize="small" />}
            </IconButton>
          </Tooltip>

          <input
            className='chat-input'
            placeholder={isListening ? '🎤 Listening...' : 'Type message here'}
            value={inputMessage}
            style={{ color: "white", flexGrow: 1, marginRight: 1, fontSize: 'medium', outline: `1px solid ${isListening ? '#ff1827' : 'white'}`, border: "none", padding: "15px", backgroundColor: "transparent", borderRadius: "5px"}}
            onChange={(e) => dispatch(setInputMessage(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button
            className='yt-search-button yt-chat-button'
            variant='contained'
            onClick={handleSend}
            endIcon={<Send fontSize='small' sx={{ clipPath: "polygon(0% 42%, 0% 0%, 90% 50%, 0% 100%, 0% 58%, 70% 50%)", color: "transparent", background: "linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%)"}} />}
            sx={{ background: "transparent", minWidth: { xs: "auto", sm: "100px" } }}
          >
            <span className='styled-color'>Send</span>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default Chat;
