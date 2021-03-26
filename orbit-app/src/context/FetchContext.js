import React, { createContext, useContext } from 'react';
import axios from 'axios';
// import { useAuthContext } from '../context/AuthContext'
const FetchContext = createContext();
const { Provider } = FetchContext;

export function useFetchContext() {
  return useContext(FetchContext);
}

const FetchProvider = ({ children }) => {
  // const authContext = useAuthContext();
  const authAxios = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    // headers: { 'Authorization': `Bearer ${authContext.authState.token}` }
  });

  // authAxios.interceptors.request.use(
  //   config => {
  //     const { origin } = new URL(config.baseURL);
  //     const allowedOrigins = ['http://localhost:3001']
  //     if (allowedOrigins.includes(origin)) {
  //       config.headers.Authorization = `Bearer ${authContext.authState.token}`
  //     }
  //     return config;
  //   },
  //   error => {
  //     return Promise.reject(error);
  //   }
  // )
  return (
    <Provider
      value={{
        authAxios
      }}
    >
      {children}
    </Provider>
  );
};

export { FetchContext, FetchProvider };
