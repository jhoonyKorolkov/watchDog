<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '#ui/types';

/**
 * Компонент формы входа в систему.
 * Отображает поле для ввода пароля и обрабатывает авторизацию с валидацией через Zod.
 */

// Zod схема для валидации формы логина
const schema = z.object({
  password: z
    .string({ message: 'Пароль обязателен' })
    .min(3, 'Пароль должен содержать минимум 3 символа')
    .max(100, 'Пароль слишком длинный'),
});

type Schema = z.output<typeof schema>;

// Получаем методы для работы с сессией
const { fetch: fetchSession } = useUserSession();

// Состояние формы с валидацией
const state = reactive({
  password: '',
});

const loading = ref(false);
const serverError = ref('');

/**
 * Обработчик отправки формы логина.
 * Отправляет пароль на сервер и обрабатывает ответ.
 */
async function handleLogin(event: FormSubmitEvent<Schema>) {
  // Сбрасываем предыдущие ошибки
  serverError.value = '';
  loading.value = true;

  try {
    // Отправляем запрос на авторизацию с валидированными данными
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        password: event.data.password,
      },
    });

    // При успешной авторизации обновляем сессию и перенаправляем на главную
    if (response.success) {
      // Обновляем сессию на клиенте
      await fetchSession();
      // Перенаправляем на главную страницу
      await navigateTo('/');
    }
  } catch (err: any) {
    // Обрабатываем ошибки от сервера
    serverError.value = err.data?.statusMessage || 'Ошибка авторизации';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UCard class="max-w-md mx-auto">
    <template #header>
      <h2 class="text-2xl font-bold text-center">Вход в систему</h2>
    </template>

    <!-- Форма с валидацией через Zod -->
    <UForm
      :schema="schema"
      :state="state"
      @submit="handleLogin"
      class="space-y-4"
    >
      <!-- Поле для ввода пароля -->
      <UFormField label="Пароль" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          placeholder="Введите пароль администратора"
          :disabled="loading"
          autocomplete="current-password"
        />
      </UFormField>

      <!-- Отображение серверных ошибок -->
      <UAlert
        v-if="serverError"
        color="error"
        icon="heroicons:exclamation-triangle-20-solid"
        :title="serverError"
        variant="subtle"
      />

      <!-- Кнопка входа -->
      <UButton type="submit" block :loading="loading" :disabled="loading">
        Войти
      </UButton>
    </UForm>
  </UCard>
</template>
