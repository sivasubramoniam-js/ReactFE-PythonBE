import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, Radio, RadioGroup, FormControlLabel, Typography, IconButton, Avatar, Box, Container, Paper, Card } from '@mui/material';
import { Visibility as VisibilityIcon, AccessTime as AccessTimeIcon, Close as CloseIcon } from '@mui/icons-material';
import { removeChildData } from './slice';

function Assistant() {
  const { list } = useSelector(state => state.data);
  console.log(list)
  const dispatch = useDispatch();

  const options = [
    { text: "Summarize the video", value: "summarize" },
    { text: "Jump to the content", value: "skip" },
    { text: "Pick the right one", value: "choose" }
  ];

  const [selectedOption, setSelectedOption] = useState(options[0].value);

  const handleRemove = (id, item) => {
    const updatedList = [];
    const updatedIndex = [];
    list.map((item) => {
      if(item.id !== id) {
        updatedList.push(item)
        updatedIndex.push(item.id)
      }
    })
    dispatch(removeChildData({ updatedList, updatedIndex }));
  };

  return (
    <Container
            component={Paper} 
            sx={{ 
                bgcolor: 'gray', 
                color: 'white',
                height: "100%"
            }}
            maxWidth="xs"
        >
      <div>
        <RadioGroup
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}
        >
          {options.map((item) => (
            <FormControlLabel
              key={item.value}
              value={item.value}
              control={<Radio />}
              label={item.text}
            />
          ))}
        </RadioGroup>
      </div>
      <div>
        <Typography variant="h6">Selected Video(s)</Typography>
        <div className=''>
          {list.map((item) => (
            <div style={{ margin: "15px 0px"}}>
              <Badge
                key={item.id} // Ensure you have a unique key for each item
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                badgeContent={
                  <IconButton  style={{zoom: '0.5', border: '1px solid gray', backgroundColor: "white"}} onClick={() => handleRemove(item.id, item)} size="small">
                    <CloseIcon />
                  </IconButton>
                }
              >
                <Card>
                  <Box display="flex" padding="10px" gap="10px">
                    <img src={item.thumbnail} alt={item.title} style={{ width: "100px", height: "100px" }} />
                    <Box>
                      <Typography
                        noWrap
                        sx={{ width: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {item.title}
                      </Typography>
                      <Box display="flex" gap="10px" padding="15px 0" alignItems="center">
                        <Avatar src={item.channel_thumbnail} sx={{ width: 30, height: 30 }} />
                        <Typography variant="body2" sx={{ margin: 0 }}>{item.channel_name}</Typography>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap="15px">
                        <Box display="flex" gap="5px" alignItems="center">
                          <VisibilityIcon />
                          <Typography variant="body2">{item.views}</Typography>
                        </Box>
                        <Box display="flex" gap="5px" alignItems="center">
                          <AccessTimeIcon />
                          <Typography variant="body2">{item.duration}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

export default Assistant;
