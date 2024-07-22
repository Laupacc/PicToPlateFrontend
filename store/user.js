import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    value: {
        token: null,
        username: null,
        email: null,
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
            state.value.email = action.payload.email;
            state.value.password = action.payload.password;
            state.value.ingredients = action.payload.ingredients;
            state.value.favourites = action.payload.favourites;
        },
        logout: (state) => {
            state.value.token = null;
            state.value.username = null;
            state.value.email = null;
            state.value.password = null;
            state.value.ingredients = [];
            state.value.favourites = [];
        },
    },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
