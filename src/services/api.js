import axios from "axios";
import { store } from "../store";
import { setLogout } from "../store/slices/userSlice";
// axios.defaults.baseURL = "https://aka-uka.up.railway.app/api/";
axios.defaults.baseURL = "http://localhost:8080/api/";

axios.interceptors.request.use(
  (config) => {
    const token = store.getState().user.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      location.href = "/login";
      store.dispatch(setLogout());
      console.error("Avtorizatsiya muddati tugagan. Qayta kiring.");
    }
    return Promise.reject(error);
  }
);

const api = {
  get: (url, params) => axios.get(url, { params }),
  post: (url, data) => axios.post(url, data),
  put: (url, data) => axios.put(url, data),
  delete: (url) => axios.delete(url),
  patch: (url, data) => axios.patch(url, data),

  // Telegram bot orqali rasm yuklash
  uploadToTelegram: async (file) => {
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await axios.post("/upload/telegram", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Telegram yuklash xatosi:", error);
      throw error;
    }
  },
};

export default api;
