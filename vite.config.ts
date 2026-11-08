import { defineConfig } from 'vite';

// relative base so the build also works from file:// (Electron desktop app)
export default defineConfig({ base: './' });
