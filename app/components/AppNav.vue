<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();
const loading = ref(false);
const toast = useToast();

async function handleLogout() {
  loading.value = true;

  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
    });

    await clear();

    toast.add({
      title: 'Выход выполнен',
      description: 'Вы успешно вышли из системы',
      color: 'success',
    });

    await navigateTo('/login', { replace: true });
  } catch (error: any) {
    toast.add({
      title: 'Ошибка',
      description: error.data?.statusMessage || 'Ошибка при выходе',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <nav
    v-if="loggedIn"
    class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
  >
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80">
          <span class="text-2xl">🐕</span>
          <span class="font-bold text-lg text-gray-900 dark:text-white">
            WatchDog
          </span>
        </NuxtLink>

        <div class="flex items-center gap-4">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            👤 {{ (user as any)?.name || 'Администратор' }}
          </div>

          <UButton
            icon="heroicons:arrow-right-on-rectangle-20-solid"
            color="error"
            variant="ghost"
            :loading="loading"
            :disabled="loading"
            @click="handleLogout"
          >
            Выход
          </UButton>
        </div>
      </div>
    </div>
  </nav>
</template>
