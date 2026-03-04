import 'vite/modulepreload-polyfill'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import './index.css'

const pages = import.meta.glob('./pages/**/*.jsx')

createInertiaApp({
  id: 'app',
  resolve: async (name) => {
    const path = `./pages/${name}.jsx`
    const loader = pages[path]
    if (!loader) throw new Error(`Inertia page not found: ${path}`)
    const module = await loader()
    return module.default
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
