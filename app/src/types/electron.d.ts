export {};

declare global {
  interface Window {
    electronAPI?: {
      quitGame?: () => Promise<void>;
    };
  }
}
