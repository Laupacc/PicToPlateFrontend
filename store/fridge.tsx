import { createSlice } from "@reduxjs/toolkit";

const initialState: { ingredients: any[] } = {
  ingredients: [],
};

export const fridgeSlice = createSlice({
  name: "fridge",
  initialState,
  reducers: {
    addIngredient: (state, action) => {
      state.ingredients = [...state.ingredients, ...action.payload];
    },
    removeIngredient: (state, action) => {
      state.ingredients = state.ingredients.filter(
        (ingredient) => ingredient !== action.payload
      );
    },
    updateIngredients: (state, action) => {
      state.ingredients = action.payload;
    },
  },
});

export const { addIngredient, removeIngredient, updateIngredients } =
  fridgeSlice.actions;
export default fridgeSlice.reducer;
