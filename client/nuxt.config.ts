// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],

  app: {
    head: {
      title: 'Finance Tracker',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    },
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    }
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3333'
    }
  },

  typescript: {
    strict: true
  },

  experimental: {
    payloadExtraction: false
  }
})