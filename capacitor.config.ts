import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.partilot.app',
  appName: 'Partilot',
  webDir: 'www',
  plugins: {
    StatusBar: {
      // Que la barra de estado (hora, batería) no se monte sobre el contenido
      overlay: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
