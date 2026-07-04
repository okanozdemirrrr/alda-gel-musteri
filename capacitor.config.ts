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
  // NOT: ios.scrollEnabled: false KALDIRILDI.
  // Native UIScrollView'u kapatmak, WKWebView'un touch event pipeline'ını
  // bozup tap/scroll ayrımını geciktiriyordu (tıklamalar 2-3 denemede çalışıyordu).
  // Rubber-banding koruması CSS tarafında zaten var:
  // html/body { overscroll-behavior: none } + .page-scroll-container { overscroll-behavior-y: none }
};

export default config;
