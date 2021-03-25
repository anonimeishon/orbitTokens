import React, { createContext, useState, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
const AuthContext = createContext();
const { Provider } = AuthContext;


export function useAuthContext() {
  return (useContext(AuthContext));
}

const AuthProvider = ({ children }) => {
  const history = useHistory();

  const [authState, setAuthState] = useState(() => {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('expiresAt');
    const userInfo = localStorage.getItem('userInfo');
    return (
      {
        token,
        expiresAt,
        userInfo: userInfo ? JSON.parse(userInfo) : {}
      });
  });



  useEffect(() => {
    localStorage.setItem('token', authState.token);
    localStorage.setItem('expiresAt', authState.expiresAt);
    localStorage.setItem('userInfo', JSON.stringify(authState.userInfo));
  }, [authState])

  const setAuthInfo = ({ token, userInfo, expiresAt }) => {
    setAuthState({
      token,
      userInfo,
      expiresAt
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('expiresAt');
    setAuthState(
      {
        token: null,
        expiresAt: null,
        userInfo: {}
      }
    );
    history.push('login');
  }

  const isAuthenticated = () => {
    if (!authState.token || !authState.expiresAt) {
      return false;
    }
    return new Date().getTime() / 1000 < authState.expiresAt
  }
  const isAdmin = () => {
    return authState.userInfo.role === 'admin';
  }
  return (
    <Provider
      value={
        {
          authState,
          setAuthState: authInfo => setAuthInfo(authInfo),
          isAuthenticated,
          logout,
          isAdmin
        }
      }
    >
      {children}
    </Provider>
  );
};

export { AuthContext, AuthProvider };
