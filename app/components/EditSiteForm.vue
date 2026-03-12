<template>
  <!-- UForm валидирует по Zod-схеме, вызывает @submit только при успехе -->
  <UForm
    :schema="updateSchema"
    :state="form"
    class="space-y-4"
    @submit="handleSubmit"
  >
    <UFormField label="Название сайта" name="name">
      <UInput
        v-model="form.name"
        placeholder="Мой сайт"
        :disabled="isLoading"
      />
    </UFormField>

    <UFormField label="URL" name="url">
      <UInput
        v-model="form.url"
        type="url"
        placeholder="https://example.com"
        :disabled="isLoading"
      />
    </UFormField>

    <UFormField label="Интервал проверки (секунды)" name="interval">
      <UInput
        v-model.number="form.interval"
        type="number"
        :min="30"
        :disabled="isLoading"
      />
    </UFormField>

    <!-- isActive хранится в SQLite как 0/1, UCheckbox работает с boolean -->
    <UCheckbox v-model="isActiveFlag" label="Активен" :disabled="isLoading" />

    <UButton type="submit" :loading="isLoading" class="w-full">
      Сохранить изменения
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { z } from 'zod';
import type { FormSubmitEvent } from '#ui/types';

// Минимальный интерфейс для пропа — не зависит от Drizzle-типов в app/
interface SiteData {
  id: number;
  name: string;
  url: string;
  interval: number;
  isActive: number;
}

const props = defineProps<{ site: SiteData }>();

// Сигнализирует родителю (UModal) о том, что сохранение прошло успешно
const emit = defineEmits<{ success: [] }>();

// Схема валидации — все поля обязательны для формы редактирования
const updateSchema = z.object({
  name: z
    .string()
    .min(3, 'Не менее 3 символов')
    .max(100, 'Не более 100 символов'),
  url: z.string().url('Некорректный URL'),
  interval: z
    .number({ error: 'Введите число' })
    .int()
    .min(30, 'Не менее 30 секунд'),
});

type UpdateFormData = z.infer<typeof updateSchema>;

// Форма предзаполнена текущими данными сайта
const form = ref<UpdateFormData>({
  name: props.site.name,
  url: props.site.url,
  interval: props.site.interval,
});

// Отдельный ref для чекбокса: SQLite хранит 0/1, UCheckbox требует boolean
const isActiveFlag = ref(props.site.isActive === 1);

const isLoading = ref(false);
const toast = useToast();

/**
 * Обработчик отправки формы.
 * Вызывается UForm только после успешной Zod-валидации.
 */
const handleSubmit = async (event: FormSubmitEvent<UpdateFormData>) => {
  isLoading.value = true;

  try {
    await $fetch(`/api/sites/${props.site.id}`, {
      method: 'PUT',
      body: {
        ...event.data,
        // Конвертируем boolean обратно в 0/1 для API
        isActive: isActiveFlag.value ? 1 : 0,
      },
    });

    toast.add({
      title: 'Сайт обновлён',
      description: `«${event.data.name}» успешно обновлён.`,
      color: 'success',
    });

    // Сигнализируем родителю: закрыть модалку и обновить список
    emit('success');
  } catch (error: unknown) {
    const apiMessage = (error as { data?: { message?: string } })?.data
      ?.message;

    const appError = createError({
      statusCode: (error as { status?: number })?.status ?? 500,
      statusMessage: apiMessage ?? 'Ошибка при обновлении сайта',
    });

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
/* Локальные стили по необходимости */
</style>
