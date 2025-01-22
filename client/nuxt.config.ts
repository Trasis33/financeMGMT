// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt'],
  app: {
    head: {
      title: 'Finance Tracker',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Personal Finance Management Application' }
      ]
    },
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    }
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3333'
    }
  },
  typescript: {
    strict: true
  },
  experimental: {
    payloadExtraction: false
  },
  nitro: {
    routeRules: {
      '/api/**': { proxy: process.env.API_BASE_URL || 'http://localhost:3333' }
    }
  }
})
