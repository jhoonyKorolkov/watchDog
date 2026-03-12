<template>
  <!-- UForm принимает схему Zod и состояние, самостоятельно управляет валидацией -->
  <UForm
    :schema="siteSchema"
    :state="form"
    class="space-y-4"
    @submit="handleSubmit"
  >
    <!-- UFormField автоматически подхватывает ошибки по полю name из схемы (Nuxt UI v4) -->
    <UFormField label="Название сайта" name="name">
      <UInput
        v-model="form.name"
        placeholder="Мой сайт"
        :disabled="isLoading"
      />
    </UFormField>

    <!-- UFormField автоматически подхватывает ошибки по полю url из схемы (Nuxt UI v4) -->
    <UFormField label="URL" name="url">
      <UInput
        v-model="form.url"
        type="url"
        placeholder="https://example.com"
        :disabled="isLoading"
      />
    </UFormField>

    <!-- Кнопка отправки -->
    <UButton type="submit" :loading="isLoading" class="w-full">
      Добавить сайт
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { z } from 'zod';
import type { FormSubmitEvent } from '#ui/types';

// Событие, которое родитель (модалка) слушает для закрытия и обновления списка
const emit = defineEmits<{ success: [] }>();

// Zod-схема используется напрямую в UForm — ручная валидация не нужна
const siteSchema = z.object({
  name: z
    .string()
    .min(1, 'Название обязательно')
    .min(3, 'Название должно быть не менее 3 символов')
    .max(100, 'Название не должно превышать 100 символов'),
  url: z.string().min(1, 'URL обязателен').url('Некорректный URL'),
});

type SiteFormData = z.infer<typeof siteSchema>;

// Реактивное состояние формы, привязанное к UForm через :state
const form = ref<SiteFormData>({
  name: '',
  url: '',
});

const isLoading = ref(false);

// useToast — нативный composable Nuxt UI для всплывающих уведомлений
const toast = useToast();

/**
 * Обработчик отправки формы.
 * Вызывается только после успешной валидации по схеме со стороны UForm.
 * Типизированное событие FormSubmitEvent гарантирует, что data уже прошла Zod.
 */
const handleSubmit = async (event: FormSubmitEvent<SiteFormData>) => {
  isLoading.value = true;

  try {
    // Отправляем данные на API; $fetch бросит FetchError при статусе 4xx/5xx
    await $fetch('/api/sites', {
      method: 'POST',
      body: event.data,
      headers: { 'Content-Type': 'application/json' },
    });

    // Уведомление об успехе через useToast — не нужен ручной successMessage
    toast.add({
      title: 'Сайт добавлен',
      description: `«${event.data.name}» успешно добавлен в мониторинг.`,
      color: 'success',
    });

    // Сбрасываем форму после успешной отправки
    form.value = { name: '', url: '' };

    // Сигнализируем родителю (UModal) об успехе — он закроет себя и обновит список
    emit('success');
  } catch (error: unknown) {
    // Извлекаем сообщение об ошибке из ответа API (FetchError содержит data)
    const apiMessage = (error as { data?: { message?: string } })?.data
      ?.message;

    // createError формирует стандартный H3Error, который можно залогировать или прокинуть выше
    const appError = createError({
      statusCode: (error as { status?: number })?.status ?? 500,
      statusMessage: apiMessage ?? 'Ошибка при добавлении сайта',
    });

    // Показываем ошибку пользователю через toast вместо inline-блока
    toast.add({
      title: 'Ошибка',
      description: appError.statusMessage,
      color: 'error',
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Локальные стили добавлять здесь по необходимости */
</style>
