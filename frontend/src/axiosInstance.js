// axiosInstance.js
import axios from 'axios';

// Create an Axios instance with the base URL
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL, // Set the base URL here
  timeout: 10000, // Optional: Set a timeout for requests (in ms)
  headers: {
    'Content-Type': 'application/json', // Optional: Set common headers
  },
});

export default axiosInstance;
