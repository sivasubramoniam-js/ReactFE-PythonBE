import React, { useState } from 'react';
import axios from "axios";
import "./YTSearch.css";
import { useDispatch } from 'react-redux';
import { updateChildData } from './slice';
import { useSelector } from 'react-redux';
import Snackbar from '@mui/material/Snackbar';
import { Alert } from '@mui/material';

function YTSearch() {
  const [keyword, setKeyword] = useState("");
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
    <div className='yt-search-container'>
        <div className='yt-search-box-container'>
            <div>YouTube Search</div>
            <div className='yt-search-box'>
                <input className='yt-search' type='text' placeholder='Enter keyword here' onChange={(e) => setKeyword(e.target.value)} value={keyword} />
                <button className='yt-search-button' onClick={getResults}>&#x1F50D;</button>
            </div>
        </div>
        <div className='yt-search-results'>
            {results && results.map((item) => (
                <div className='yt-search-result'>
                    <img className='yt-thumb' src={item.thumbnail} />
                    <div className='yt-title'>{item.title}</div>
                    <div className='tw-auto yt-actions'>
                        <button className='yt-result-button' onClick={() => handleChange(item.id, item)}>Add to list &#x271A;</button>
                        <a href={item.link} target='_blank' className='yt-result-button'>Play &#x2197;</a>
                    </div>
                </div>
            ))}
        </div>
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
    </div>
  )
}

export default YTSearch