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
    const refreshExpiresAt = sessionStorage.getItem('refreshExpiresAt');
    const accessExpiresAt = sessionStorage.getItem('accessExpiresAt');
    const userInfo = sessionStorage.getItem('userInfo');
    return (
      {
        refreshExpiresAt,
        accessExpiresAt,
        userInfo: userInfo ? JSON.parse(userInfo) : {}
      });
  });



  useEffect(() => {

    sessionStorage.setItem('refreshExpiresAt', authState.refreshExpiresAt);
    sessionStorage.setItem('accessExpiresAt', authState.accessExpiresAt);
    sessionStorage.setItem('userInfo', JSON.stringify(authState.userInfo));

  }, [authState])

  const setAuthInfo = ({ userInfo, refreshExpiresAt, accessExpiresAt }) => {
    setAuthState({
      userInfo,
      refreshExpiresAt,
      accessExpiresAt
    });
  };

  const logout = () => {

    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('refreshExpiresAt');
    sessionStorage.removeItem('accessExpiresAt')
    setAuthState(
      {
        refreshExpiresAt: null,
        accessExpiresAt: null,
        userInfo: {}
      }
    );
    history.push('login');
  }

  const isAuthenticated = () => {
    if (!authState.refreshExpiresAt) {
      return false;
    }
    // return new Date().getTime() / 1000 < authState.expiresAt
    if (new Date().getTime() / 1000 < authState.refreshExpiresAt) {
      return true;
    } else {
      sessionStorage.removeItem('userInfo');
      sessionStorage.removeItem('refreshExpiresAt');
      sessionStorage.removeItem('accessExpiresAt');
      return false;
    }
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
