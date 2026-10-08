import './assets/styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { loadRuntimeConfig } from './services/api/runtimeConfig'
import { initApiClient } from './services/api/client'

async function bootstrap(): Promise<void> {
  // La configurazione serve prima di qualsiasi chiamata: senza, l'app non parte.
  const config = await loadRuntimeConfig()
  initApiClient(config)

  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  app.mount('#app')
}

bootstrap().catch((error: unknown) => {
  const root = document.getElementById('app')
  if (root === null) return
  const message = document.createElement('p')
  message.setAttribute('role', 'alert')
  message.textContent = `Impossibile avviare dr-mailroom: ${error instanceof Error ? error.message : String(error)}. Controlla public/config.json (modello: config.example.json).`
  root.replaceChildren(message)
})
