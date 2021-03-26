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
    const expiresAt = sessionStorage.getItem('expiresAt');
    const userInfo = sessionStorage.getItem('userInfo');
    return (
      {
        expiresAt,
        userInfo: userInfo ? JSON.parse(userInfo) : {}
      });
  });



  useEffect(() => {
    sessionStorage.setItem('expiresAt', authState.expiresAt);
    sessionStorage.setItem('userInfo', JSON.stringify(authState.userInfo));

  }, [authState])

  const setAuthInfo = ({ userInfo, expiresAt }) => {
    setAuthState({
      userInfo,
      expiresAt
    });
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('expiresAt');
    setAuthState(
      {
        expiresAt: null,
        userInfo: {}
      }
    );
    history.push('login');
  }

  const isAuthenticated = () => {
    if (!authState.expiresAt) {
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
