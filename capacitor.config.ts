import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mergen.aldagel',
  appName: 'Alda Gel',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'aldagelmarket.com.tr',
      '*.aldagelmarket.com.tr',
      '*.supabase.co',
    ],
  },
};

export default config;
