'use client';

import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import ResultsView from '@/components/ResultsView';

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  function handleLogin(newSessionId: string) {
    setSessionId(newSessionId);
  }

  function handleLogout() {
    // Explicitly null out all session state
    setSessionId(null);
  }

  return (
    <main>
      {sessionId === null ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <ResultsView sessionId={sessionId} onLogout={handleLogout} />
      )}
    </main>
  );
}
