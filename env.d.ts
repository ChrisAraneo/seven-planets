/// <reference types="vite/client" />

// Shim for typed .vue imports where the TS program lacks the Vue language
// Plugin (typescript-eslint's project service); vue-tsc resolves SFCs itself
// And ignores this wildcard.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent;
  export default component;
}
