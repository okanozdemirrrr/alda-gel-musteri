import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mergen.aldagel',
  appName: 'Alda Gel',
  webDir: 'out',
  server: {
    url: 'https://musteri-nine.vercel.app',
    cleartext: true,
    allowNavigation: ['*']
  }
};

export default config;
