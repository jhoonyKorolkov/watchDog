<script setup lang="ts">
// Определяем тип данных сайта с проверками
// Необходим из-за использования кэша, где теряется автоматический вывод типов
type SiteWithChecks = {
  id: number;
  url: string;
  name: string;
  interval: number;
  isActive: number;
  deletedAt: number | null;
  checks: Array<{
    id: number;
    siteId: number;
    status: number;
    responseTime: number;
    timestamp: number;
    error: string | null;
    createdAt: number;
  }>;
};

const {
  data: sites,
  refresh,
  pending,
} = await useFetch<SiteWithChecks[]>('/api/status');

const toast = useToast();

// Управляет видимостью модального окна добавления сайта
const isModalOpen = ref(false);

/**
 * Вызывается по событию success из AddSiteForm:
 * закрывает модалку и обновляет список сайтов.
 */
const handleSiteAdded = () => {
  isModalOpen.value = false;
  refresh();
};

// Тип одной записи из ответа /api/status (сайт + последний check)
type SiteEntry = SiteWithChecks;

// null = модалка закрыта; SiteEntry = открыта с данными этого сайта
const editingSite = ref<SiteEntry | null>(null);
const deletingSite = ref<SiteEntry | null>(null);
const isDeleting = ref(false);

// Вычисляемые v-model для UModal — управляют через ref-объекты
const isEditModalOpen = computed({
  get: () => editingSite.value !== null,
  set: (v: boolean) => {
    if (!v) editingSite.value = null;
  },
});

const isDeleteModalOpen = computed({
  get: () => deletingSite.value !== null,
  set: (v: boolean) => {
    if (!v) deletingSite.value = null;
  },
});

const openEditModal = (site: SiteEntry) => {
  editingSite.value = site;
};
const openDeleteModal = (site: SiteEntry) => {
  deletingSite.value = site;
};

/** Закрывает модалку редактирования и перезапрашивает список */
const handleSiteUpdated = () => {
  editingSite.value = null;
  refresh();
};

/** Отправляет DELETE-запрос, затем закрывает модалку и обновляет список */
const handleDeleteConfirm = async () => {
  if (!deletingSite.value) return;
  isDeleting.value = true;

  try {
    await $fetch(`/api/sites/${deletingSite.value.id}`, { method: 'DELETE' });
    toast.add({
      title: 'Сайт удалён',
      description: `«${deletingSite.value.name}» удалён из мониторинга.`,
      color: 'success',
    });
    deletingSite.value = null;
    refresh();
  } catch (error: unknown) {
    const msg =
      (error as { data?: { message?: string } })?.data?.message ??
      'Ошибка при удалении';
    toast.add({ title: 'Ошибка', description: msg, color: 'error' });
  } finally {
    isDeleting.value = false;
  }
};

/**
 * Переключает статус активности сайта (isActive).
 * @param site - объект сайта
 * @param newValue - новое значение от USwitch (true/false)
 */
const switchActivateSite = async (site: SiteEntry, newValue: boolean) => {
  try {
    // Конвертируем boolean в 0/1 для SQLite
    const isActive = newValue ? 1 : 0;

    await $fetch(`/api/sites/${site.id}`, {
      method: 'PATCH',
      body: { isActive },
    });

    // Перезагружаем данные с сервера для обновления UI
    await refresh();

    toast.add({
      title: isActive ? 'Сайт активирован' : 'Сайт деактивирован',
      description: `«${site.name}» теперь ${isActive ? 'активен' : 'неактивен'}.`,
      color: isActive ? 'success' : 'neutral',
    });
  } catch (error: unknown) {
    const apiMessage = (error as { data?: { message?: string } })?.data
      ?.message;

    const appError = createError({
      statusCode: (error as { status?: number })?.status ?? 500,
      statusMessage: apiMessage ?? 'Ошибка при переключении статуса сайта',
    });

    toast.add({
      title: 'Ошибка',
      description: appError.statusMessage,
      color: 'error',
    });

    // При ошибке тоже обновляем данные, чтобы вернуть переключатель в исходное состояние
    await refresh();
  }
};

// useColorMode — composable Nuxt UI/Color Mode для переключения темы
const colorMode = useColorMode();

/**
 * Переключает тему между светлой и тёмной.
 * Значение сохраняется в localStorage автоматически через @nuxt/color-mode.
 */
const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};

const getStatusColor = (status?: number) => {
  if (status === 200) return 'success';
  if (!status) return 'neutral';
  return 'error';
};

const getStatusIcon = (status?: number) => {
  if (status === 200) return 'heroicons:check-circle-20-solid';
  if (!status) return 'heroicons:question-mark-circle-20-solid';
  return 'heroicons:x-circle-20-solid';
};
</script>

<template>
  <div
    class="min-h-screen from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
  >
    <div class="container mx-auto py-12 px-4">
      <!-- Заголовок -->
      <div class="flex items-center justify-between mb-12">
        <div>
          <!-- <h1 class="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            🐕 Сторожевой Пёс
          </h1> -->
          <p class="text-lg text-slate-600 dark:text-slate-400">
            Мониторинг проектов в реальном времени
          </p>
        </div>
        <div class="flex items-center gap-3">
          <ClientOnly>
            <template #fallback>
              <!-- Placeholder: skeleton-кнопки для плавного перехода -->
              <USkeleton class="h-10 w-10 rounded-md" />
              <USkeleton class="h-10 w-36 rounded-md" />
              <USkeleton class="h-10 w-28 rounded-md" />
            </template>

            <!-- Реальные кнопки: появляются после hydration -->
            <!-- Кнопка переключения светлой/тёмной темы -->
            <UButton
              :icon="
                colorMode.value === 'dark'
                  ? 'heroicons:sun-20-solid'
                  : 'heroicons:moon-20-solid'
              "
              size="lg"
              color="neutral"
              variant="ghost"
              :aria-label="
                colorMode.value === 'dark'
                  ? 'Переключить на светлую тему'
                  : 'Переключить на тёмную тему'
              "
              @click="toggleColorMode"
            />
            <!-- Кнопка открывает UModal с формой добавления сайта -->
            <UButton
              icon="heroicons:plus-20-solid"
              size="lg"
              @click="isModalOpen = true"
            >
              Добавить сайт
            </UButton>
            <UButton
              icon="heroicons:arrow-path-20-solid"
              size="lg"
              color="neutral"
              variant="subtle"
              @click="() => refresh()"
              :loading="pending"
              :disabled="pending"
            >
              Обновить
            </UButton>
          </ClientOnly>
        </div>
      </div>

      <!-- Модальное окно добавления нового сайта -->
      <UModal
        v-model:open="isModalOpen"
        title="Добавить сайт"
        description="Введите название и URL сайта для добавления в мониторинг"
      >
        <template #body>
          <AddSiteForm @success="handleSiteAdded" />
        </template>
      </UModal>

      <!-- Модальное окно редактирования сайта -->
      <UModal
        v-model:open="isEditModalOpen"
        :title="`Редактировать: ${editingSite?.name ?? ''}`"
        description="Измените параметры сайта для мониторинга"
      >
        <template #body>
          <!-- v-if гарантирует сброс состояния формы при каждом открытии -->
          <EditSiteForm
            v-if="editingSite"
            :site="editingSite"
            @success="handleSiteUpdated"
          />
        </template>
      </UModal>

      <!-- Модальное окно подтверждения удаления -->
      <UModal
        v-model:open="isDeleteModalOpen"
        title="Удалить сайт"
        :description="`Вы уверены? Сайт «${deletingSite?.name ?? ''}» и все его данные проверок будут удалены безвозвратно.`"
      >
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="subtle"
              @click="deletingSite = null"
            >
              Отмена
            </UButton>
            <UButton
              color="error"
              :loading="isDeleting"
              @click="handleDeleteConfirm"
            >
              Удалить
            </UButton>
          </div>
        </template>
      </UModal>

      <!-- Прелоадер: показывается пока загружаются данные -->
      <div
        v-if="pending"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <!-- Генерируем 3 skeleton-карточки для эффекта загрузки -->
        <UCard v-for="i in 3" :key="i" class="animate-pulse">
          <template #header>
            <div class="flex items-center justify-between">
              <USkeleton class="h-6 w-32" />
              <USkeleton class="h-6 w-24" />
            </div>
          </template>

          <div class="space-y-4">
            <!-- URL skeleton -->
            <div>
              <USkeleton class="h-3 w-12 mb-2" />
              <USkeleton class="h-4 w-full" />
            </div>

            <!-- Интервал и Response Time skeleton -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <USkeleton class="h-3 w-16 mb-2" />
                <USkeleton class="h-5 w-12" />
              </div>
              <div>
                <USkeleton class="h-3 w-12 mb-2" />
                <USkeleton class="h-5 w-16" />
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex items-center justify-between">
              <USkeleton class="h-4 w-40" />
              <div class="flex items-center gap-1">
                <USkeleton class="h-8 w-8 rounded-md" />
                <USkeleton class="h-8 w-8 rounded-md" />
                <USkeleton class="h-8 w-8 rounded-md" />
              </div>
            </div>
          </template>
        </UCard>
      </div>

      <!-- Сетка карточек: показывается когда данные загружены -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="site in sites"
          :key="site.id"
          class="hover:shadow-lg transition-shadow duration-200"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <h3
                  class="text-lg font-semibold text-slate-900 dark:text-white"
                >
                  {{ site.name }}
                </h3>
                <UBadge
                  :color="getStatusColor(site.checks?.[0]?.status)"
                  variant="subtle"
                  class="text-sm"
                >
                  <UIcon
                    :name="getStatusIcon(site.checks?.[0]?.status)"
                    class="w-4 h-4 mr-1"
                  />
                  {{ site.checks?.[0]?.status || 'Нет данных' }}
                </UBadge>
              </div>

              <USwitch
                :model-value="site.isActive === 1"
                @update:model-value="(val) => switchActivateSite(site, val)"
                aria-label="Активировать/деактивировать сайт"
                class="cursor-pointer"
              />
            </div>
          </template>

          <div class="space-y-4">
            <!-- URL -->
            <div>
              <p
                class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1"
              >
                URL
              </p>
              <p
                class="text-sm text-slate-700 dark:text-slate-300 truncate font-mono"
              >
                {{ site.url }}
              </p>
            </div>

            <!-- Интервал и Response Time -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p
                  class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1"
                >
                  Интервал
                </p>
                <p
                  class="text-base font-semibold text-slate-900 dark:text-white"
                >
                  {{ site.interval }}s
                </p>
              </div>
              <div>
                <p
                  class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1"
                >
                  Ответ
                </p>
                <p
                  class="text-base font-semibold"
                  :class="
                    site.checks?.[0]?.responseTime
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400'
                  "
                >
                  {{ site.checks?.[0]?.responseTime || '—' }}ms
                </p>
              </div>
            </div>
          </div>

          <!-- Footer: статус слева, кнопки действий справа -->
          <template #footer>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="getStatusIcon(site.checks?.[0]?.status)"
                  :class="[
                    'w-5 h-5',
                    site.checks?.[0]?.status === 200
                      ? 'text-green-500'
                      : site.checks?.[0]?.status
                        ? 'text-red-500'
                        : 'text-slate-400',
                  ]"
                />
                <span class="text-xs text-slate-600 dark:text-slate-400">
                  {{
                    site.checks?.[0]?.status === 200
                      ? 'Всё работает отлично'
                      : site.checks?.[0]?.status
                        ? `Ошибка ${site.checks[0].status}`
                        : 'Ожидание первой проверки'
                  }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <ClientOnly>
                  <template #fallback>
                    <!-- Placeholder: 3 skeleton-кнопки -->
                    <USkeleton class="h-8 w-8 rounded-md" />
                    <USkeleton class="h-8 w-8 rounded-md" />
                    <USkeleton class="h-8 w-8 rounded-md" />
                  </template>

                  <!-- Реальные кнопки действий -->
                  <!-- Кнопка открывает модалку редактирования с данными этой карточки -->
                  <UButton
                    size="md"
                    color="info"
                    variant="ghost"
                    icon="heroicons:eye-20-solid"
                    aria-label="Просмотреть детали сайта"
                    @click="navigateTo(`/sites/${site.id}`)"
                    class="cursor-pointer"
                  />

                  <UButton
                    size="md"
                    color="neutral"
                    variant="ghost"
                    icon="heroicons:pencil-square-20-solid"
                    aria-label="Редактировать сайт"
                    @click="openEditModal(site)"
                    class="cursor-pointer"
                  />
                  <!-- Кнопка открывает модалку подтверждения удаления -->
                  <UButton
                    size="md"
                    color="error"
                    variant="ghost"
                    icon="heroicons:trash-20-solid"
                    aria-label="Удалить сайт"
                    @click="openDeleteModal(site)"
                    class="cursor-pointer"
                  />
                </ClientOnly>
              </div>
            </div>
          </template>
        </UCard>
      </div>

      <!-- Пусто: показывается когда данные загружены, но список пуст -->
      <div
        v-if="!pending && (!sites || sites.length === 0)"
        class="text-center py-12"
      >
        <UIcon
          name="heroicons:inbox-20-solid"
          class="w-12 h-12 mx-auto mb-4 text-slate-400"
        />
        <p class="text-slate-600 dark:text-slate-400">
          Нет сайтов для мониторинга
        </p>
      </div>
    </div>
  </div>
</template>
