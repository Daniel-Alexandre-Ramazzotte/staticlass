// tamagui.config.ts
import { config } from '@tamagui/config/v3'; // ou v4 dependendo da versão instalada
import { createTamagui } from 'tamagui';

export const tamaguiConfig = createTamagui(config);

export default tamaguiConfig;

// Configuração de Tipagem para o TypeScript funcionar bem
export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
