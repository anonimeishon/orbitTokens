import React, { createContext, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuthContext } from '../context/AuthContext'
const FetchContext = createContext();
const { Provider } = FetchContext;

export function useFetchContext() {
  return useContext(FetchContext);
}

const FetchProvider = ({ children }) => {


  const authContext = useAuthContext();
  const authAxios = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    // headers: { 'Authorization': `Bearer ${authContext.authState.token}` }
  });

  // authAxios.interceptors.request.use(
  //   config => {
  //     console.log(config)
  //     return config;
  //   },
  //   error => {
  //     console.log(error)
  //     return Promise.reject(error);
  //   }
  // )







  useEffect(() => {
    const refreshToken = async () => {
      try {
        const { data } = await authAxios.post(
          'refresh-token',
          authContext.authState.userInfo
        );
        authContext.setAuthState({
          ...authContext.authState,
          accessExpiresAt: data.accessExpiresAt
        })

      } catch (err) {
        console.error(err.message);
      }
    }
    if (authContext.authState.accessExpiresAt) {
      setTimeout(refreshToken, 600000)
    }
  }, [authContext.authState, authContext, authAxios])


  // authAxios.interceptors.response.use(res => {
  //   return res
  // },
  //   err => {
  //     if (err.response.status === 401) {
  //       if (authContext.authState.accessExpiresAt < new Date().getTime() / 1000) {
  //         //FIXME
  //         refreshToken(3, err.config)
  //       }
  //     }
  //     console.log(err.response);
  //     throw new Error(err.response.data.statusText)
  //   })

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
