'use client';

import { useSearchParams } from 'next/navigation';
import { useAuth } from '../_hooks/useAuth';
import { useAuthGuard } from '../_hooks/useAuthGuard';
import './styles.scss';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useAppTranslation } from 'app/_hooks/useAppTranslation';

enum LoginState {
  Email = 'EMAIL',
  Code = 'CODE',
  Processing = 'PROCESSING',
}

function LoginForm(): React.ReactElement {
  const { t } = useAppTranslation();

  const { sendLoginLink, verifyLoginLink } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const { authGuard } = useAuthGuard({
    isLogin: true,
    redirectUrl: '/rundown',
  });

  const [loginState, setLoginState] = useState<LoginState>(LoginState.Email);
  const [email, setEmail] = useState('');
  const verificationAttemptedRef = useRef(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const email = formData.get('email') as string;
    setEmail(email);
    await sendLoginLink(email);
    setLoginState(LoginState.Code);
  };

  useEffect(() => {
    if (sessionId && !verificationAttemptedRef.current) {
      verificationAttemptedRef.current = true;
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
          <li className="step step-secondary">
            {t("LoginPage.steps.email")}
          </li>
          <li
            className={
              'step ' +
              (loginState === LoginState.Code ||
                loginState === LoginState.Processing
                ? 'step-secondary'
                : '')
            }
          >
            {t("LoginPage.steps.check")}
          </li>
          <li
            className={
              'step ' +
              (loginState === LoginState.Processing ? 'step-secondary' : '')
            }
          >
            {t("LoginPage.steps.verify")}
          </li>
        </ul>
      </div>
      <div>
        {loginState === LoginState.Email && (
          <div className="step-container bg-secondary">
            <p className="text-secondary-content">{t("LoginPage.welcome")}</p>
            <form className="flex gap-4" onSubmit={handleSubmit}>
              <label className="input">
                <span className="label">{t("LoginPage.emailLabel")}</span>
                <input type="text" placeholder="pepe@day.party" name="email" />
              </label>
              <button className="btn btn-primary" type="submit">
                {t("LoginPage.nextButton")}
              </button>
            </form>
          </div>
        )}
        {loginState === LoginState.Code && (
          <div className="step-container bg-secondary">
            <p className="text-secondary-content">{t("LoginPage.codeSent", { email: email })}</p>
          </div>
        )}
        {loginState === LoginState.Processing && (
          <div className="step-container bg-secondary text-secondary-content">{t("LoginPage.verifying")}</div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useAppTranslation();

  return (
    <Suspense fallback={<div className="text-secondary-content">{t("LoginPage.loading")}</div>}>
      <LoginForm />
    </Suspense>
  );
}