import { axiosInstance } from './axios.js';

export const api = {
  get: async (endpoint, params) => {
    try {
      const response = await axiosInstance.get(endpoint, { params });
      return response.data;
    } catch (err) {
      const error = new Error(err.response?.data?.error?.message || err.message || 'Request failed');
      error.status = err.response?.status;
      error.code = err.response?.data?.error?.code;
      error.details = err.response?.data?.error?.details;
      throw error;
    }
  },

  post: async (endpoint, data, isMultipart = false) => {
    try {
      const config = {};
      if (isMultipart) {
        config.headers = { 'Content-Type': 'multipart/form-data' };
      }
      const response = await axiosInstance.post(endpoint, data, config);
      return response.data;
    } catch (err) {
      const error = new Error(err.response?.data?.error?.message || err.message || 'Request failed');
      error.status = err.response?.status;
      error.code = err.response?.data?.error?.code;
      error.details = err.response?.data?.error?.details;
      throw error;
    }
  },

  patch: async (endpoint, data) => {
    try {
      const response = await axiosInstance.patch(endpoint, data);
      return response.data;
    } catch (err) {
      const error = new Error(err.response?.data?.error?.message || err.message || 'Request failed');
      error.status = err.response?.status;
      error.code = err.response?.data?.error?.code;
      error.details = err.response?.data?.error?.details;
      throw error;
    }
  },

  delete: async (endpoint) => {
    try {
      const response = await axiosInstance.delete(endpoint);
      return response.data;
    } catch (err) {
      const error = new Error(err.response?.data?.error?.message || err.message || 'Request failed');
      error.status = err.response?.status;
      error.code = err.response?.data?.error?.code;
      error.details = err.response?.data?.error?.details;
      throw error;
    }
  },
};
