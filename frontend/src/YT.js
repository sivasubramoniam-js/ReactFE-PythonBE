import React, { useState } from 'react';
import { Container, Grid, TextField, IconButton, Card, CardMedia, CardContent, Button, Typography, Paper, Box, Avatar, Tooltip, styled } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Visibility as VisibilityIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import QueueIcon from '@mui/icons-material/Queue';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import axios from "axios";
import { useDispatch } from 'react-redux';
import { updateChildData } from './slice';
import { useSelector } from 'react-redux';
import Snackbar from '@mui/material/Snackbar';
import { Alert } from '@mui/material';

const CssTextField = styled(TextField)({
    color: "white",
    '& label.Mui-focused': {
      color: 'unset',
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: 'white',
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'white',
      },
      '&:hover fieldset': {
        borderColor: 'white',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'white',
        borderWidth: "1px",
      },
    },
  });

export const CardItem = ({item, handleChange}) => (
    <Grid key={item.id} marginY="10px" width="100%">
        <Card sx={{backgroundColor: "#fdfdfd08", color: "white"}}>
            <Box display="flex" padding="10px" gap="10px">
                <Box display="flex" flexDirection="column" justifyContent="space-evenly" alignItems="center">
                    <img src={item.thumbnail} alt={item.title} style={{ width: "100px", height: "100px" }} />
                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: "unset" }}>
                        <Box display="flex" gap="5px" alignItems="center">
                            <PlayArrowIcon />
                            <Typography variant="body2">Watch</Typography>
                        </Box>
                    </a>
                </Box>
                <Box>
                <Tooltip title={item.title} placement='bottom-start'>
                    <Typography
                        noWrap
                        sx={{ width: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
                    >
                        {item.title}
                    </Typography>
                </Tooltip>
                <Box display="flex" gap="10px" padding="15px 0" alignItems="center">
                    <Avatar src={item.channel_thumbnail} sx={{ width: 30, height: 30 }} />
                    <Typography variant="body2" sx={{ margin: 0 }}>{item.channel_name}</Typography>
                </Box>
                <Box display="flex" flexWrap="wrap" gap="40px" paddingBottom="10px">
                    <Box display="flex" gap="5px" alignItems="center">
                        <VisibilityIcon />
                        <Typography variant="body2">{item.views}</Typography>
                    </Box>
                    <Box display="flex" gap="5px" alignItems="center">
                        <AccessTimeIcon />
                        <Typography variant="body2">{item.duration}</Typography>
                    </Box>
                </Box>
                <Box  display="flex" justifyContent="center">
                    <Box display="flex" gap="5px" sx={{cursor: "pointer"}} onClick={() => handleChange(item.id, item)}>
                        <QueueIcon /> {/* Replace with your Add to List icon */}
                        <Typography variant="body2">Add to List</Typography>
                    </Box>
                </Box>
                </Box>
            </Box>
        </Card>
    </Grid>
)

const YouTubeSearch = () => {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState([]);
    const [showSnack, setShowSnack] = useState(false)
    const globalData = useSelector(state => state.data);

    const dispatch = useDispatch();
    
    const handleChange = (id, item) => {
        if(globalData.id.includes(id)) {
            setShowSnack(true);
        } else {
            dispatch(updateChildData({ id, data: item }));
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            getResults();
        }
    }

    const getResults = () => {
        axios.get(`/searchVideo?keyword=${keyword}`).then((res) => {
            setResults([...res.data.result])
        })
    }

    return (
        <Container 
            component={Paper} 
            sx={{ 
                bgcolor: 'gray', 
                color: 'white',
                height: "100%",
                background: "#ffffff21",
            }}
            style={{ padding: 0}}
            maxWidth="xs"
        >
            <Grid item container xs={12} pt={3} px={4} alignItems="center">
                <Typography variant="h6" gutterBottom className='styled-color' >
                    YouTube Search
                </Typography>
                <CssTextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter keyword here"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onEnter
                    InputProps={{
                        endAdornment: (
                            <IconButton onClick={getResults} color="inherit">
                                <SearchIcon />
                            </IconButton>
                        ),
                        style: {paddingRight: 0, color: "white"}
                    }}
                    style={{ marginBottom: "10px" }}
                />
            </Grid>
            <Grid item style={{ height: 'calc(100vh - 260px)', overflow: 'auto'}} px={4} container xs={12} overflow='auto' spacing={2} margin={0} marginY={1} width="100%">
                {results && results.map((item) => (
                    <CardItem item={item} handleChange={handleChange} />
                ))}
            </Grid>
            <Snackbar
                anchorOrigin={{ vertical:"top", horizontal:"right" }}
                open={showSnack}
                onClose={() => setShowSnack(false)}
                autoHideDuration={2000}
            >
                <Alert
                    onClose={() => setShowSnack(false)}
                    severity="error"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    Already added video to the list
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default YouTubeSearch;
