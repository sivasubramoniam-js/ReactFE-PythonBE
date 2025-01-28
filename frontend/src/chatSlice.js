// redux/chatSlice.js
import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    inputMessage: '',
    option: '',
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
    setOptionValue: (state, action) => {
      state.option = action.payload;
    }
  },
});

export const { addMessage, setInputMessage, clearInputMessage, setOptionValue } = chatSlice.actions;
export default chatSlice.reducer;