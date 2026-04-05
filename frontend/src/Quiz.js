import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Radio, RadioGroup, FormControlLabel, 
  FormControl, Card, CardContent, Divider, Select, MenuItem, 
  InputLabel, LinearProgress, Paper, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import { 
  Share as ShareIcon, 
  EmojiEvents as TrophyIcon, 
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  WorkspacePremium as CertificateIcon,
  Group as LeaderboardIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const TIMER_SECONDS = 30;

const Quiz = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoData = useSelector(state => state.data);
  const [stage, setStage] = useState('config'); // config, loading, playing, result, leaderboard
  const [config, setConfig] = useState({ level: 'beginner', num_questions: 10, timed: false });
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [userName, setUserName] = useState(() => localStorage.getItem('yt_user_name') || '');
  const [challengeId, setChallengeId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [reviewData, setReviewData] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalVideoAttempts, setTotalVideoAttempts] = useState(0);
  const [language, setLanguage] = useState('English');
  // ── FEATURE 7: Timed Quiz ─────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = React.useRef(null);
  // ─────────────────────────────────────────────────────────────────────────

  const languages = [
    "English", "French", "Chinese", "Japanese", "Swedish", "Spanish", "German", 
    "Tamil", "Hindi", "Telugu", "Malayalam", "Korean"
  ];

  useEffect(() => {
    // Find video details from redux or placeholder
    const video = videoData.complete_list.find(v => v.id === videoId);
    if (video) {
        setCurrentVideo(video);
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const cid = urlParams.get('challenge');
    if (cid) {
      loadChallenge(cid);
    }
  }, [videoId, videoData]);

  const loadChallenge = async (cid) => {
    try {
      setStage('loading');
      const res = await axios.get(`/getChallenge/${cid}`);
      const challenge = res.data;
      setChallengeId(cid);
      const targetVideo = {
        id: challenge.video_id,
        title: challenge.video_title,
        thumbnail: challenge.video_thumbnail
      };
      setCurrentVideo(targetVideo);
      setTotalVideoAttempts(challenge.total_video_attempts || 0);
      setConfig({ level: challenge.level, num_questions: challenge.question_count });
      
      // Fetch leaderboard for this challenge
      const lbRes = await axios.get(`/getLeaderboard/${cid}`);
      setLeaderboard(lbRes.data.leaderboard);
      
      setStage('config');
    } catch (err) {
      if (err.response && err.response.status === 410) {
        setError("This challenge has expired (active for 24 hours only).");
      } else {
        setError("Challenge not found or error loading it.");
      }
      setStage('config');
    }
  };

  const startQuiz = async (level = config.level, num = config.num_questions, vId = null) => {
    const targetVideoId = vId || videoId || currentVideo?.id;
    
    if (!targetVideoId) {
      setError("No video ID provided!");
      return;
    }
    
    setStage('loading');
    setError(null);
    try {
      const res = await axios.post('/generateQuiz', {
        id: [targetVideoId],
        level: level,
        num_questions: num,
        language: language
      });
      const quizArray = res.data.quiz;
      
      if (quizArray && Array.isArray(quizArray)) {
        // First shuffle the order of questions
        const shuffledQuestions = shuffleArray(quizArray);
        
        // Then shuffle the options within each question
        const formattedQuiz = shuffledQuestions.map(q => ({
          ...q,
          options: shuffleArray(q.options)
        }));

        setQuestions(formattedQuiz);
        setStage('playing');
        setCurrentQuestionIndex(0);
        setAnswers({});
        setTimeLeft(TIMER_SECONDS);
      } else {
        throw new Error("Invalid quiz data received");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate quiz. Please try again.");
      setStage('config');
    }
  };

  const handleAnswerChange = (event) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: event.target.value
    });
  };

  const handleNext = (forceSkip = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(TIMER_SECONDS);
    } else {
      calculateResult();
    }
  };

  // ── FEATURE 7: Timer effect ───────────────────────────────────────────────
  React.useEffect(() => {
    if (stage !== 'playing' || !config.timed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleNext(true); // auto advance
          return TIMER_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [stage, currentQuestionIndex, config.timed]);
  // ─────────────────────────────────────────────────────────────────────────

  const calculateResult = async () => {
    setStage('loading');
    const targetVideoId = videoId || currentVideo?.id;
    try {
      const res = await axios.post('/validateQuiz', {
        video_id: targetVideoId,
        level: config.level,
        language: language,
        answers: answers,
        questions: questions // Send the list of questions so backend knows which subset to validate
      });
      
      const finalScore = res.data.score;
      setScore(finalScore);
      setReviewData(res.data.results);
      setCorrectCount(res.data.correct_count);
      setStage('result');
      // ── FEATURE 3: Auto-record progress ──────────────────────────────────
      const storedName = localStorage.getItem('yt_user_name') || userName;
      if (storedName) {
        const targetVideoId = videoId || currentVideo?.id;
        axios.post('/recordProgress', {
          user_name: storedName,
          video_id: targetVideoId,
          video_title: currentVideo?.title || '',
          video_thumbnail: currentVideo?.thumbnail || '',
          level: config.level,
          score: finalScore
        }).catch(err => console.log('Progress recording failed:', err));
      }
      // ─────────────────────────────────────────────────────────────────────
    } catch (err) {
      setError("Failed to validate quiz results.");
      setStage('playing');
    }
  };

  const handleCreateChallenge = async () => {
    const targetVideoId = videoId || currentVideo?.id;
    try {
      const res = await axios.post('/createChallenge', {
        video_id: targetVideoId,
        video_title: currentVideo?.title,
        video_thumbnail: currentVideo?.thumbnail,
        level: config.level,
        num_questions: config.num_questions,
        creator_name: userName || "Genius"
      });
      setChallengeId(res.data.challenge_id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitScore = async () => {
    if (!userName) return;
    try {
      await axios.post('/submitScore', {
        challenge_id: challengeId || 'global',
        user_name: userName,
        score: score
      });
      viewLeaderboard();
    } catch (err) {
      console.error(err);
    }
  };

  const viewLeaderboard = async () => {
    try {
      const res = await axios.get(`/getLeaderboard/${challengeId || 'global'}`);
      setLeaderboard(res.data.leaderboard);
      setStage('leaderboard');
    } catch (err) {
      console.error(err);
    }
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleRetake = () => {
    const reshuffledQuiz = questions.map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));
    setQuestions(reshuffledQuiz);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setStage('playing');
  };

  const renderConfig = () => (
    <Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ color: 'white' }}>Cancel</Button>
      </Box>
      <TrophyIcon sx={{ fontSize: { xs: 50, md: 80 }, color: '#ffe85d', mb: 2 }} />
      <Typography variant="h3" className="styled-color" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '2rem', md: '3rem' } }}>Tutorial Masters</Typography>
      
      {currentVideo && (
        <Card sx={{ mb: 4, background: 'rgba(255,255,255,0.1)', color: 'white', maxWidth: 500, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', p: 2, gap: 2, alignItems: 'center' }}>
                <img src={currentVideo.thumbnail} alt="" style={{ width: 120, borderRadius: 8 }} />
                <Typography variant="subtitle1" textAlign="left">{currentVideo.title}</Typography>
            </Box>
        </Card>
      )}

      <Typography variant="body1" sx={{ mb: 4, color: '#eee', maxWidth: 600 }}>
        Ready to sharpen your skills? Our AI will generate a unique quiz based purely on this tutorial.
      </Typography>

      {totalVideoAttempts > 0 && (
        <Typography variant="subtitle2" sx={{ mb: 2, color: '#ffe85d', fontWeight: 'bold' }}>
          🔥 This video has been challenged {totalVideoAttempts} times!
        </Typography>
      )}

      {leaderboard.length > 0 && (
        <Box sx={{ width: '100%', maxWidth: 500, mb: 4 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <LeaderboardIcon sx={{ color: '#ffe85d' }} /> Previous Warriors
          </Typography>
          <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.05)', color: 'white', maxHeight: 200 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#aaa', py: 1 }}>R</TableCell>
                  <TableCell sx={{ color: '#aaa', py: 1 }}>Name</TableCell>
                  <TableCell sx={{ color: '#aaa', py: 1 }} align="right">Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ color: 'white', py: 0.5 }}>{index + 1}</TableCell>
                    <TableCell sx={{ color: 'white', py: 0.5 }}>{row.user_name}</TableCell>
                    <TableCell sx={{ color: 'white', py: 0.5 }} align="right">{row.score}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      
      {/* Timed Mode Toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, justifyContent: 'center' }}>
        <Box
          onClick={() => setConfig({ ...config, timed: !config.timed })}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            cursor: 'pointer',
            px: 2, py: 1,
            borderRadius: '20px',
            border: config.timed ? '1px solid #ff1827' : '1px solid rgba(255,255,255,0.2)',
            background: config.timed ? 'rgba(255,24,39,0.1)' : 'transparent',
            transition: 'all 0.2s'
          }}
        >
          <Typography variant="body2" sx={{ color: config.timed ? '#ff6b6b' : '#aaa' }}>⏱ Timed Mode</Typography>
          <Box sx={{
            width: 36, height: 20, borderRadius: '10px',
            bgcolor: config.timed ? '#ff1827' : 'rgba(255,255,255,0.2)',
            position: 'relative', transition: 'all 0.2s'
          }}>
            <Box sx={{
              position: 'absolute', top: 2, left: config.timed ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%', bgcolor: 'white',
              transition: 'left 0.2s'
            }} />
          </Box>
        </Box>
        {config.timed && (
          <Typography variant="caption" sx={{ color: '#ff6b6b' }}>{TIMER_SECONDS}s per question</Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
        <FormControl variant="outlined" sx={{ minWidth: { xs: '100%', sm: 150 }, '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'white' } } }}>
          <InputLabel sx={{ color: 'white' }}>Level</InputLabel>
          <Select
            value={config.level}
            onChange={(e) => setConfig({ ...config, level: e.target.value })}
            label="Level"
            sx={{ color: 'white' }}
          >
            <MenuItem value="beginner">Beginner</MenuItem>
            <MenuItem value="intermediate">Intermediate</MenuItem>
            <MenuItem value="expert">Expert</MenuItem>
          </Select>
        </FormControl>

        <FormControl variant="outlined" sx={{ minWidth: { xs: '100%', sm: 150 }, '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'white' } } }}>
          <InputLabel sx={{ color: 'white' }}>Questions</InputLabel>
          <Select
            value={config.num_questions}
            onChange={(e) => setConfig({ ...config, num_questions: e.target.value })}
            label="Questions"
            sx={{ color: 'white' }}
          >
            {[10, 20, 30, 40, 50].map(num => (
              <MenuItem key={num} value={num}>{num} Questions</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" sx={{ minWidth: { xs: '100%', sm: 150 }, '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'white' } } }}>
          <InputLabel sx={{ color: 'white' }}>Language</InputLabel>
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            label="Language"
            sx={{ color: 'white' }}
          >
            {languages.map(lang => (
              <MenuItem key={lang} value={lang}>{lang}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => startQuiz()}
          sx={{ 
            background: "linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%)",
            color: '#000',
            fontWeight: 'bold',
            px: { xs: 4, md: 6 },
            py: 1.5,
            borderRadius: '30px'
          }}
          startIcon={<TrophyIcon />}
        >
          Start Quiz
        </Button>

        <Button 
          variant="outlined" 
          size="large"
          onClick={handleCreateChallenge}
          sx={{ 
            borderColor: '#ffe85d',
            color: '#ffe85d',
            fontWeight: 'bold',
            px: { xs: 4, md: 6 },
            py: 1.5,
            borderRadius: '30px',
            '&:hover': { borderColor: '#fff', color: '#fff' }
          }}
          startIcon={<ShareIcon />}
        >
          Create Challenge
        </Button>
      </Box>

      {challengeId && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#aaa' }}>Share this challenge link (valid for 24h):</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#ffe85d' }}>{`${window.location.origin}/?challenge=${challengeId}`}</Typography>
            <IconButton size="small" sx={{ color: 'white' }} onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?challenge=${challengeId}`)}><CopyIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderLoading = () => (
    <Box sx={{ p: 8, textAlign: 'center' }}>
      <Typography variant="h6" className="styled-color" gutterBottom>Generating your quiz...</Typography>
      <Typography variant="body2" sx={{ mb: 4, color: '#ccc' }}>AI is analyzing the video content to create relevant questions.</Typography>
      <LinearProgress sx={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #ff1827, #ffe85d, #08cfff)' } }} />
    </Box>
  );

  const renderPlaying = () => {
    const q = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const timerPct = (timeLeft / TIMER_SECONDS) * 100;
    const timerColor = timeLeft > 15 ? '#4CAF50' : timeLeft > 8 ? '#FF9800' : '#f44336';

    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ color: '#aaa' }}>Question {currentQuestionIndex + 1} of {questions.length}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {config.timed && (
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={timerPct}
                  size={36}
                  thickness={4}
                  sx={{ color: timerColor, transition: 'color 0.3s' }}
                />
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: timerColor, fontWeight: 'bold', fontSize: '0.7rem' }}>{timeLeft}</Typography>
                </Box>
              </Box>
            )}
            <Typography variant="subtitle2" sx={{ color: '#aaa' }}>Level: {config.level.toUpperCase()}</Typography>
          </Box>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 3, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        
        <Card sx={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', color: 'white', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 4, minHeight: '60px' }}>{q?.question}</Typography>
            
            <RadioGroup value={answers[currentQuestionIndex] || ''} onChange={handleAnswerChange}>
              {q?.options.map((opt, i) => (
                <Card 
                  key={i} 
                  sx={{ 
                    mb: 1.5, 
                    background: answers[currentQuestionIndex] === opt ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: answers[currentQuestionIndex] === opt ? '1px solid #ffe85d' : '1px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': { background: 'rgba(255, 255, 255, 0.1)' }
                  }}
                >
                  <FormControlLabel 
                    value={opt} 
                    control={<Radio sx={{ color: 'white', '&.Mui-checked': { color: '#ffe85d' } }} />} 
                    label={opt} 
                    sx={{ width: '100%', m: 0, p: 1, color: 'white' }}
                  />
                </Card>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            disabled={!answers[currentQuestionIndex]}
            onClick={handleNext}
            sx={{ 
              background: "linear-gradient(81.02deg, rgb(255 24 39) -23.49%, rgb(255 232 93) 45.66%, rgb(8 207 255) 114.8%)",
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '20px',
              opacity: !answers[currentQuestionIndex] ? 0.5 : 1
            }}
            endIcon={currentQuestionIndex < questions.length - 1 ? <ArrowForwardIcon /> : null}
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </Button>
        </Box>
      </Box>
    );
  };

  const renderResult = () => (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h4" className="styled-color" gutterBottom>Quiz Completed!</Typography>
      
      <Box sx={{ my: 4, position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box sx={{ 
          width: 150, height: 150, borderRadius: '50%', 
          border: '8px solid', 
          borderColor: score >= 70 ? '#4caf50' : '#f44336',
          display: 'flex', flexDirection: 'column', justifyContent: 'center'
        }}>
          <Typography variant="h3" sx={{ color: score >= 70 ? '#4caf50' : '#f44336' }}>{score}%</Typography>
          <Typography variant="caption">Score</Typography>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
        {score >= 70 ? "Congratulations! You passed!" : "Keep learning and try again!"}
      </Typography>
      <Typography variant="body2" sx={{ color: '#aaa', mb: 4 }}>
        You got {correctCount} out of {questions.length} correct.
      </Typography>

      {score >= 70 && (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', color: 'white', p: 3, borderRadius: 4, border: '2px solid #ffe85d' }}>
           <Typography variant="overline" sx={{ letterSpacing: 3 }}>CERTIFICATE OF COMPLETION</Typography>
           <Typography variant="h5" sx={{ my: 2, fontFamily: 'serif' }}>{userName || "Learner"}</Typography>
           <Typography variant="body2">has successfully completed the {config.level} level quiz for</Typography>
           <Typography variant="subtitle1" sx={{ fontStyle: 'italic', my: 1 }}>{currentVideo?.title || "the tutorial"}</Typography>
           <CertificateIcon sx={{ fontSize: 60, color: '#ffe85d', mt: 2 }} />
        </Card>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 350, mx: 'auto' }}>
        <TextField 
          placeholder="Enter your name for leaderboard/certificate" 
          variant="outlined" 
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'white' } } }}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={handleRetake} sx={{ color: 'white', borderColor: 'white' }}>Retake</Button>
          <Button fullWidth variant="contained" startIcon={<LeaderboardIcon />} onClick={handleSubmitScore} sx={{ background: 'white', color: 'black' }}>Submit</Button>
        </Box>

        <Button fullWidth variant="contained" onClick={() => setStage('review')} sx={{ mt: 1, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', color: 'white' }}>Review Quiz</Button>

        <Button 
          variant="outlined" 
          startIcon={<ShareIcon />} 
          onClick={handleCreateChallenge} 
          sx={{ color: '#ffe85d', borderColor: '#ffe85d' }}
        >
          Challenge Friends
        </Button>

        {challengeId && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" noWrap sx={{ color: '#ffe85d' }}>{`${window.location.origin}/?challenge=${challengeId}`}</Typography>
            <IconButton size="small" sx={{ color: 'white' }} onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?challenge=${challengeId}`)}><CopyIcon fontSize="small" /></IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );

  const renderReview = () => (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" className="styled-color" sx={{ mb: 4, textAlign: 'center' }}>Quiz Review</Typography>
      
      {reviewData.map((item, index) => (
        <Card key={index} sx={{ mb: 3, background: 'rgba(255, 255, 255, 0.05)', color: 'white', borderRadius: 4, border: item.is_correct ? '1px solid #4caf50' : '1px solid #f44336' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 1 }}>Question {index + 1}</Typography>
            <Typography variant="h6" sx={{ mb: 2 }}>{item.question}</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {item.options.map((opt, i) => {
                let color = 'white';
                let bgcolor = 'rgba(255,255,255,0.05)';
                let border = '1px solid transparent';
                
                if (opt === item.answer) {
                  color = '#4caf50';
                  bgcolor = 'rgba(76, 175, 80, 0.1)';
                  border = '1px solid #4caf50';
                } else if (opt === item.user_answer && !item.is_correct) {
                  color = '#f44336';
                  bgcolor = 'rgba(244, 67, 54, 0.1)';
                  border = '1px solid #f44336';
                }
                
                return (
                  <Box key={i} sx={{ p: 1.5, borderRadius: 2, bgcolor, color, border, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>{opt}</Typography>
                    {opt === item.answer && <Typography variant="caption" sx={{ fontWeight: 'bold' }}>CORRECT ANSWER</Typography>}
                    {opt === item.user_answer && opt !== item.answer && <Typography variant="caption" sx={{ fontWeight: 'bold' }}>YOUR ANSWER</Typography>}
                  </Box>
                );
              })}
            </Box>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#ffe85d', mb: 0.5 }}>Explanation:</Typography>
              <Typography variant="body2">{item.explanation}</Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
      
      <Button fullWidth variant="contained" size="large" onClick={() => setStage('result')} sx={{ mt: 2, borderRadius: 4, background: 'white', color: 'black' }}>Back to Results</Button>
    </Box>
  );

  const renderLeaderboard = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <LeaderboardIcon sx={{ color: '#ffe85d' }} />
        <Typography variant="h5" className="styled-color">Leaderboard</Typography>
      </Box>
      
      <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#aaa' }}>Rank</TableCell>
              <TableCell sx={{ color: '#aaa' }}>Name</TableCell>
              <TableCell sx={{ color: '#aaa' }} align="right">Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((row, index) => (
              <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell sx={{ color: 'white' }}>{index + 1}</TableCell>
                <TableCell sx={{ color: 'white' }}>{row.user_name}</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">
                  <Typography sx={{ fontWeight: 'bold', color: row.score >= 70 ? '#4caf50' : '#f44336' }}>{row.score}%</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button fullWidth sx={{ mt: 4, color: 'white' }} onClick={() => setStage('config')}>Back to Quiz</Button>
    </Box>
  );

  return (
    <Paper sx={{ 
      minHeight: '100vh', 
      overflow: 'auto',
      background: 'transparent',
      color: 'white',
      borderRadius: 0,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {stage === 'config' && renderConfig()}
      {stage === 'loading' && renderLoading()}
      {stage === 'playing' && renderPlaying()}
      {stage === 'result' && renderResult()}
      {stage === 'review' && renderReview()}
      {stage === 'leaderboard' && renderLeaderboard()}
    </Paper>
  );
};

export default Quiz;
