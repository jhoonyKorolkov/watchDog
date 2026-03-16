<script setup lang="ts">
/**
 * Страница авторизации.
 * Если пользователь уже авторизован, перенаправляет на главную страницу.
 */

// Получаем состояние сессии
const { loggedIn } = useUserSession();

// Если пользователь уже авторизован, перенаправляем на главную
if (loggedIn.value) {
  await navigateTo('/');
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
  >
    <div class="w-full">
      <LoginForm />
    </div>
  </div>
</template>
