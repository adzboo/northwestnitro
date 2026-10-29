'use client';

import {useEffect, useState} from 'react';

export default function HeaderAccount() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch('/api/auth', {cache: 'no-store', signal: controller.signal});
        if (response.ok) {
          const data = await response.json();
          setSignedIn(data.signedIn === true);
        }
      } catch { /* Keep the account link usable if the session check is unavailable. */ }
    }
    void refresh();
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.removeEventListener('focus', refresh); };
  }, []);
  return <a href="/account" className="button header-account">{signedIn ? 'My account' : 'Sign in / My racing'}</a>;
}
