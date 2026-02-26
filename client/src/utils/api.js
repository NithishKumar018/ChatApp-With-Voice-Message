import axios from "axios";

const API = axios.create({ baseURL: "/api" });

// Attach token to every request
API.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem("chatUser"));
    if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

export default API;
