import { configureStore } from '@reduxjs/toolkit';
import dataReducer from './slice';
import chatReducer from './chatSlice';

// Create the store
const store = configureStore({
  reducer: {
    data: dataReducer,
    chat: chatReducer,
  }
});

export default store;
