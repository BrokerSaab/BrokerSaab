import https from 'https';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
}

/**
 * Send a push notification via Expo Push API.
 * Uses the Expo managed push service — no FCM/APNs keys required.
 * token must be an Expo push token (format: ExponentPushToken[...])
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!token || !token.startsWith('ExponentPushToken')) return;

  const message: PushMessage = { to: token, title, body, sound: 'default', data };
  const payload = JSON.stringify([message]);

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'exp.host',
        path: '/--/api/v2/push/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
      },
      (res) => {
        res.resume(); // drain response
        resolve();
      }
    );
    req.on('error', () => resolve()); // non-fatal — never throw on push failure
    req.write(payload);
    req.end();
  });
}
