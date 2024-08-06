// redux/chatSlice.js
import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    inputMessage: '',
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setInputMessage: (state, action) => {
      state.inputMessage = action.payload;
    },
    clearInputMessage: (state) => {
      state.inputMessage = '';
    },
  },
});

export const { addMessage, setInputMessage, clearInputMessage } = chatSlice.actions;
export default chatSlice.reducer;