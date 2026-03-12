<script setup lang="ts">
const route = useRoute();

// Получаем числовой ID из параметра маршрута /sites/:id
const siteId = Number(route.params.id);

// useFetch с автовыведенным типом из Nitro-эндпоинта GET /api/sites/:id
const {
  data: site,
  pending,
  error,
  refresh,
} = await useFetch(`/api/sites/${siteId}`);

// Редирект на главную, если сайт не найден (404 от API)
if (error.value?.statusCode === 404) {
  await navigateTo('/');
}

/**
 * Форматирует Unix-время (мс) в читаемую дату.
 * Date.now() и БД хранят мс, поэтому делить не нужно.
 */
const formatDate = (ts: number) =>
  new Date(ts).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

// Цвет бейджа по HTTP-статусу
const getStatusColor = (status?: number) => {
  if (!status) return 'neutral';
  if (status < 400) return 'success';
  return 'error';
};

// Вычисляем процент успешных проверок из имеющейся истории
const uptimePercent = computed(() => {
  const checks = site.value?.checks;
  if (!checks?.length) return null;
  const ok = checks.filter((c) => c.status > 0 && c.status < 400).length;
  return ((ok / checks.length) * 100).toFixed(1);
});

// Среднее время ответа по успешным проверкам
const avgResponseTime = computed(() => {
  const checks = site.value?.checks?.filter(
    (c) => c.status > 0 && c.status < 400,
  );
  if (!checks?.length) return null;
  const sum = checks.reduce((acc, c) => acc + c.responseTime, 0);
  return Math.round(sum / checks.length);
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
  >
    <div class="container mx-auto py-12 px-4 max-w-4xl">
      <!-- Кнопка назад -->
      <div class="mb-8">
        <UButton
          icon="heroicons:arrow-left-20-solid"
          color="neutral"
          variant="ghost"
          to="/"
        >
          Назад к списку
        </UButton>
      </div>

      <!-- Скелетон при загрузке -->
      <div v-if="pending" class="space-y-6">
        <USkeleton class="h-10 w-64" />
        <USkeleton class="h-32 w-full" />
        <USkeleton class="h-64 w-full" />
      </div>

      <template v-else-if="site">
        <!-- Заголовок страницы -->
        <div class="flex items-start justify-between mb-8 gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
                {{ site.name }}
              </h1>
              <!-- Бейдж активности сайта -->
              <UBadge
                :color="site.isActive ? 'success' : 'neutral'"
                variant="subtle"
              >
                {{ site.isActive ? 'Активен' : 'Остановлен' }}
              </UBadge>
            </div>
            <a
              :href="site.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-blue-600 dark:text-blue-400 font-mono hover:underline break-all"
            >
              {{ site.url }}
            </a>
          </div>
          <UButton
            icon="heroicons:arrow-path-20-solid"
            color="neutral"
            variant="subtle"
            :loading="pending"
            @click="() => refresh()"
          >
            Обновить
          </UButton>
        </div>

        <!-- Сводка: 3 ключевые метрики -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <UCard>
            <div class="text-center py-2">
              <p
                class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1"
              >
                Последний статус
              </p>
              <UBadge
                :color="getStatusColor(site.checks?.[0]?.status)"
                size="lg"
                class="text-xl font-bold"
              >
                {{ site.checks?.[0]?.status ?? 'Нет данных' }}
              </UBadge>
            </div>
          </UCard>

          <UCard>
            <div class="text-center py-2">
              <p
                class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1"
              >
                Uptime (последние {{ site.checks?.length ?? 0 }} проверок)
              </p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ uptimePercent !== null ? `${uptimePercent}%` : '—' }}
              </p>
            </div>
          </UCard>

          <UCard>
            <div class="text-center py-2">
              <p
                class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1"
              >
                Среднее время ответа
              </p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ avgResponseTime !== null ? `${avgResponseTime} мс` : '—' }}
              </p>
            </div>
          </UCard>
        </div>

        <!-- Параметры сайта -->
        <UCard class="mb-8">
          <template #header>
            <h2 class="text-base font-semibold text-slate-900 dark:text-white">
              Параметры
            </h2>
          </template>
          <dl class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <dt
                class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1"
              >
                ID
              </dt>
              <dd class="text-sm font-mono text-slate-800 dark:text-slate-200">
                {{ site.id }}
              </dd>
            </div>
            <div>
              <dt
                class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1"
              >
                Интервал
              </dt>
              <dd
                class="text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                {{ site.interval }} сек
              </dd>
            </div>
            <div>
              <dt
                class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1"
              >
                Последняя проверка
              </dt>
              <dd class="text-sm text-slate-800 dark:text-slate-200">
                {{
                  site.checks?.[0]?.timestamp
                    ? formatDate(site.checks[0].timestamp)
                    : '—'
                }}
              </dd>
            </div>
          </dl>
        </UCard>

        <!-- Таблица истории проверок -->
        <UCard>
          <template #header>
            <h2 class="text-base font-semibold text-slate-900 dark:text-white">
              История проверок
              <span class="ml-2 text-xs font-normal text-slate-400">
                (последние {{ site.checks?.length ?? 0 }})
              </span>
            </h2>
          </template>

          <!-- Нет данных -->
          <div
            v-if="!site.checks?.length"
            class="text-center py-8 text-slate-400"
          >
            <UIcon
              name="heroicons:clock-20-solid"
              class="w-8 h-8 mx-auto mb-2"
            />
            <p>Проверок ещё не было</p>
          </div>

          <!-- Таблица -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-700">
                  <th
                    class="text-left py-2 px-3 text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide"
                  >
                    Время
                  </th>
                  <th
                    class="text-left py-2 px-3 text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide"
                  >
                    Статус
                  </th>
                  <th
                    class="text-left py-2 px-3 text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide"
                  >
                    Ответ, мс
                  </th>
                  <th
                    class="text-left py-2 px-3 text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide"
                  >
                    Ошибка
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="check in site.checks"
                  :key="check.id"
                  class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td
                    class="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap"
                  >
                    {{ formatDate(check.timestamp) }}
                  </td>
                  <td class="py-2 px-3">
                    <UBadge
                      :color="getStatusColor(check.status)"
                      variant="subtle"
                      size="sm"
                    >
                      {{ check.status || 'timeout' }}
                    </UBadge>
                  </td>
                  <td class="py-2 px-3 text-slate-700 dark:text-slate-300">
                    {{ check.responseTime }} мс
                  </td>
                  <td
                    class="py-2 px-3 text-red-500 dark:text-red-400 text-xs font-mono"
                  >
                    {{ check.error ?? '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </template>
    </div>
  </div>
</template>
