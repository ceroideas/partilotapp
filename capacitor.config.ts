import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'sipart',
  webDir: 'www',
  plugins: {
    StatusBar: {
      // Que la barra de estado (hora, batería) no se monte sobre el contenido
      overlay: false,
    },
  },
};

export default config;
