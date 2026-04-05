import { createSlice } from '@reduxjs/toolkit';

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    list: [],
    id: [],
    complete_list: []
  },
  reducers: {
    updateChildData: (state, action) => {
      const { data, id } = action.payload;
      state.id.push(id);
      state.list.push(data);
      state.complete_list.push(data);
    },
    removeChildData: (state, action) => {
      const { updatedList, updatedIndex } = action.payload;
      console.log(updatedIndex)
      state.id = updatedIndex
      state.list = updatedList
    }
  }
});

export const { updateChildData, removeChildData } = dataSlice.actions;
export default dataSlice.reducer;
