import { defineConfig } from 'wxt';

export default defineConfig({
  publicDir: 'extension-public',
  manifest: {
    name: 'Export Proof',
    description: 'Compare a live canvas with its PNG or PDF export, locally.',
    version: '1.0.0',
    permissions: ['activeTab', 'scripting', 'storage', 'downloads', 'unlimitedStorage'],
    action: { default_title: 'Capture canvas for Export Proof' },
    commands: {
      '_execute_action': {
        suggested_key: { default: 'Alt+Shift+P', mac: 'MacCtrl+Shift+P' }
      }
    },
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    }
  },
  outDir: '.output'
});
