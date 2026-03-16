// https://nuxt.com/docs/api/configuration/nuxt-config
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  vite: {
    plugins: [tsconfigPaths()],
  },

  nitro: {
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      // Расписание настраивается через переменную окружения MONITOR_SCHEDULE
      // По умолчанию: каждую минуту
      // Формат cron: минута час день месяц день_недели
      // Примеры: '*/1 * * * *' (каждую минуту), '*/5 * * * *' (каждые 5 минут)
      [process.env.MONITOR_SCHEDULE || '*/1 * * * *']: ['monitor'],
    },
  },

  modules: ['@nuxt/ui', 'nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'system', // default value of $colorMode.preference
    fallback: 'light', // fallback value if not system preference found
  },
});
