'use client';

import '../../styles/input.css';
import './styles.scss';

import React, { useState, useEffect } from 'react';

enum LoginState {
  Email = 'EMAIL',
  Code = 'CODE',
  Processing = 'PROCESSING'
}

export default function LoginComponent(): React.ReactElement {
  const [loginState, setLoginState] = useState<LoginState>(LoginState.Email);
  const [email, setEmail] = useState('');

  const changeEmail = (e) => {
    setEmail(e.target.value);
  }

  const handleEmailSubmit = () => {
    // Validación del email
    setLoginState(LoginState.Code);
  };

  useEffect(() => {
    // Verificar si hay un sessionId en la URL
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      setLoginState(LoginState.Processing);
    }
  }, []);

  return (
    <div className='login-container'>
      <div><ul className="steps my-4 w-full">
        <li className="step step-secondary">Email</li>
        <li className={"step " + ((loginState === LoginState.Code || loginState === LoginState.Processing) ? "step-secondary" : "")}>Code</li>
        <li className={"step " + (loginState === LoginState.Processing ? "step-secondary" : "")}>Verifying</li>
      </ul></div>
      <div>
        {loginState === LoginState.Email && (
          <div className='step-container bg-secondary'>
            <p>Beinvenido a day.party tu agenda menos agenda</p>
            <div>
              <label className="input">
                <span className="label">Your email</span>
                <input type="text" placeholder="pepe@day.party" />
              </label>
              <button className='btn btn-primary' onClick={handleEmailSubmit} type='button'>Siguiente</button>
            </div>
          </div>
        )}
        {loginState === LoginState.Code && (
          <div className='step-container bg-secondary'>
            <p>We have sent a code to {email}. Please check your spam</p>
          </div>
        )}
        {loginState === LoginState.Processing && (
          <div className='step-container bg-secondary'>Procesando...</div>
        )}
      </div>
    </div>
  );
}



