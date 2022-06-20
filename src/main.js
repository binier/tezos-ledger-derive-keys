window.global = window;
if (global === undefined) {
   var global = window;
}
import { Buffer } from 'buffer'
global.Buffer = Buffer
global.process = { browser: true };

import App from './App.svelte'

const app = new App({
  target: document.getElementById('app')
})

export default app
