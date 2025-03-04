'use client';

import { useSearchParams } from 'next/navigation';
import { useAuth } from '../_hooks/useAuth';
import { useAuthGuard } from '../_hooks/useAuthGuard';
import './styles.scss';

import React, { useState, useEffect, Suspense } from 'react';

enum LoginState {
  Email = 'EMAIL',
  Code = 'CODE',
  Processing = 'PROCESSING',
}

function LoginForm(): React.ReactElement {
  const { sendLoginLink, verifyLoginLink } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const { authGuard } = useAuthGuard({
    isLogin: true,
    redirectUrl: '/rundown',
  });

  const [loginState, setLoginState] = useState<LoginState>(LoginState.Email);
  const [email, setEmail] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const email = formData.get('email') as string;
    setEmail(email);
    await sendLoginLink(email);
    setLoginState(LoginState.Code);
  };

  useEffect(() => {
    if (sessionId) {
      setLoginState(LoginState.Processing);
      verifyLoginLink(sessionId).catch((error) => {
        console.error('Failed to verify session:', error);
      });
    }
  }, [sessionId, verifyLoginLink]);

  return authGuard(
    <div className="login-container">
      <div>
        <ul className="steps my-4 w-full">
          <li className="step step-secondary">Email</li>
          <li
            className={
              'step ' +
              (loginState === LoginState.Code ||
              loginState === LoginState.Processing
                ? 'step-secondary'
                : '')
            }
          >
            Check
          </li>
          <li
            className={
              'step ' +
              (loginState === LoginState.Processing ? 'step-secondary' : '')
            }
          >
            Verify
          </li>
        </ul>
      </div>
      <div>
        {loginState === LoginState.Email && (
          <div className="step-container bg-secondary">
            <p>Welcome to day.party! Your less-agenda agenda</p>
            <form className="flex gap-4" onSubmit={handleSubmit}>
              <label className="input">
                <span className="label">Your email</span>
                <input type="text" placeholder="pepe@day.party" name="email" />
              </label>
              <button className="btn btn-primary" type="submit">
                Next
              </button>
            </form>
          </div>
        )}
        {loginState === LoginState.Code && (
          <div className="step-container bg-secondary">
            <p>We have sent a code to {email}. Please check your spam</p>
          </div>
        )}
        {loginState === LoginState.Processing && (
          <div className="step-container bg-secondary">Verifying...</div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
