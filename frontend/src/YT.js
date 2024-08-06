import React, { useState } from 'react';
import { Container, Grid, TextField, IconButton, Card, CardMedia, CardContent, Button, Typography, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import axios from "axios";
import { useDispatch } from 'react-redux';
import { updateChildData } from './slice';
import { useSelector } from 'react-redux';
import Snackbar from '@mui/material/Snackbar';
import { Alert } from '@mui/material';

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

    const getResults = () => {
        axios.get(`http://127.0.0.1:5000/searchVideo?keyword=${keyword}`).then((res) => {
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
                overflowY: 'auto'
            }}
            maxWidth="xs"
        >
            <Grid item container xs={12} sx={{ backgroundColor: 'gray'}} pt={1} position='sticky' zIndex={9} top={0} alignItems="center">
                <Typography variant="h6" gutterBottom>
                    YouTube Search
                </Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter keyword here"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <IconButton onClick={getResults} color="inherit">
                                <SearchIcon />
                            </IconButton>
                        ),
                        style: {paddingRight: 0}
                    }}
                    style={{ marginBottom: "10px"}}
                />
            </Grid>
            <Grid item container xs={12} overflow='auto' spacing={2} margin={0} marginY={1} width="100%">
                {results && results.map((item) => (
                    <Grid key={item.id} marginY="10px" width="100%">
                        <Card sx={{ bgcolor: 'brown', borderRadius: 5, padding: 0, width: "100%" }}>
                            <CardMedia
                                style={{padding: "0"}}
                                component="img"
                                alt={item.title}
                                image={item.thumbnail}
                                sx={{ borderRadius: '15px 15px 0 0', aspectRatio: '16/9', height: 'auto' }}
                            />
                            <CardContent>
                                <Typography
                                    variant="subtitle2"
                                    noWrap
                                    sx={{ textAlign: 'center', mb: 1 }}
                                >
                                    {item.title}
                                </Typography>
                                <Grid container spacing={1} justifyContent="center">
                                    <Grid item>
                                        <Button
                                            variant="outlined"
                                            color="inherit"
                                            startIcon={<AddIcon />}
                                            onClick={() => handleChange(item.id, item)}
                                        >
                                            Add to list
                                        </Button>
                                    </Grid>
                                    <Grid item>
                                        <Button
                                            variant="outlined"
                                            color="inherit"
                                            startIcon={<PlayArrowIcon />}
                                            href={item.link}
                                            target="_blank"
                                        >
                                            Play
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            <Snackbar
                anchorOrigin={{ vertical:"top", horizontal:"center" }}
                open={showSnack}
                onClose={() => setShowSnack(false)}
                autoHideDuration={1000}
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
