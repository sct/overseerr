/* eslint-disable no-console */
import axios from 'axios';
import React, { useEffect } from 'react';
import useSettings from '../../hooks/useSettings';
import { useUser } from '../../hooks/useUser';

const ServiceWorkerSetup: React.FC = () => {
  const { currentSettings } = useSettings();
  const { user } = useUser();
  useEffect(() => {
    if ('serviceWorker' in navigator && user?.id) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          console.log(
            '[SW] Registration successful, scope is:',
            registration.scope
          );

          if (currentSettings.enablePushRegistration) {
            const sub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: currentSettings.vapidPublic,
            });

            const parsedSub = JSON.parse(JSON.stringify(sub));

            if (parsedSub.keys.p256dh && parsedSub.keys.auth) {
              await axios.post('/api/v1/user/registerPushSubscription', {
                endpoint: parsedSub.endpoint,
                p256dh: parsedSub.keys.p256dh,
                auth: parsedSub.keys.auth,
              });
            }
          }
        })
        .catch(function (error) {
          console.log('[SW] Service worker registration failed, error:', error);
        });
    }
  }, [
    user,
    currentSettings.vapidPublic,
    currentSettings.enablePushRegistration,
  ]);
  return null;
};

export default ServiceWorkerSetup;
