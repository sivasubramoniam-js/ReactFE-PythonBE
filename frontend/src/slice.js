import { createSlice } from '@reduxjs/toolkit';

// Create a slice of state
const dataSlice = createSlice({
  name: 'data',
  initialState: {
    list: [],
    id: [],
  },
  reducers: {
    updateChildData: (state, action) => {
      const { data, id } = action.payload;
      const updatedId = state.id.push(id);
      const updatedList = state.list.push(data);
      state = {
        list: updatedList,
        id: updatedId
      }
    },
    removeChildData: (state, action) => {
      const { updatedList, updatedIndex } = action.payload;
      console.log(updatedIndex)
      state.id = updatedIndex
      state.list = updatedList
    }
  }
});

// Export actions and reducer
export const { updateChildData, removeChildData } = dataSlice.actions;
export default dataSlice.reducer;
