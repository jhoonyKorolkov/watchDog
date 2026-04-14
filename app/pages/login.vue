<script setup lang="ts">
const { loggedIn } = useUserSession();

if (loggedIn.value) {
  await navigateTo('/');
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-800 px-4"
  >
    <div class="w-full">
      <LoginForm />
    </div>
  </div>
</template>
