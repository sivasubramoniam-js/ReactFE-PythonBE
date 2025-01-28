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
      const updatedId = state.id.push(id);
      const updatedList = state.list.push(data);
      const updatedCompleteList = state.complete_list.push(data);
      state = {
        list: updatedList,
        id: updatedId,
        complete_list: updatedCompleteList
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

export const { updateChildData, removeChildData } = dataSlice.actions;
export default dataSlice.reducer;
