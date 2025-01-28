import { configureStore } from '@reduxjs/toolkit';
import dataReducer from './slice';
import chatReducer from './chatSlice';

const store = configureStore({
  reducer: {
    data: dataReducer,
    chat: chatReducer,
  }
});

export default store;
