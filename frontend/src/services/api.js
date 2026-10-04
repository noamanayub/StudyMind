import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true,
  timeout: 130000,
});
export const errorMessage = (error) =>
  error.response?.data?.message ||
  (error.code === "ERR_NETWORK"
    ? "Cannot connect to Study Mind. Check that the server is running and try again."
    : "Something went wrong. Please try again.");
export const contentUrl = (id) =>
  `${api.defaults.baseURL}/documents/${id}/content`;
export async function get(path, config) {
  return (await api.get(path, config)).data.data;
}
