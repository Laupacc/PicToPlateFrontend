import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    value: {
        token: null,
        username: null,
        password: null,
        ingredients: [],
        favourites: [],
    },
};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login: (state, action) => {
            state.value.token = action.payload.token;
            state.value.username = action.payload.username;
            state.value.password = action.payload.password;
            state.value.ingredients = action.payload.ingredients;
            state.value.favourites = action.payload.favourites;
        },
        logout: (state) => {
            state.value.token = null;
            state.value.username = null;
            state.value.password = null;
            state.value.ingredients = [];
            state.value.favourites = [];
        },
        updateFavouriteRecipes: (state, action) => {
            state.value.favourites = action.payload;
        }
    },
});

export const { login, logout, updateFavouriteRecipes } = userSlice.actions;
export default userSlice.reducer;
