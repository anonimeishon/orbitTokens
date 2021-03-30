import React, { useState } from 'react';
import GradientButton from './common/GradientButton';
import AuthDebugger from './AuthDebugger';
import { useFetchContext } from '../context/FetchContext'

const Footer = () => {
  const [showAuthDebugger, setShowAuthDebugger] = useState(
    false
  );
  const fetchContext = useFetchContext();
  return (
    <footer className="p-6">
      <div className="ml-2">
        <GradientButton
          text="Auth Debugger"
          onClick={() =>
            setShowAuthDebugger(!showAuthDebugger)
          }
        />
        <GradientButton text="fetch token" onClick={fetchContext.refreshToken} />
      </div>
      <div className="mt-4">
        {showAuthDebugger && <AuthDebugger />}
      </div>
    </footer>
  );
};

export default Footer;
