<script setup lang="ts">
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js';

// Регистрация компонентов Chart.js, необходимых для линейного графика
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

// Тип данных проверки из эндпоинта (inferSelect из checks)
type CheckData = {
  id: number;
  siteId: number;
  status: number;
  responseTime: number;
  timestamp: number;
  error: string | null;
  createdAt: number;
};

// Входные параметры компонента
const props = defineProps<{
  siteId: number;
}>();

// Получаем статистику с сервера
const { data: checks, pending } = await useFetch<CheckData[]>(
  `/api/sites/${props.siteId}/stats`,
);

/**
 * Форматирует Unix-время в читаемую дату для оси X графика.
 * Показываем только время (часы:минуты).
 */
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Подготовка данных для графика времени ответа
const chartData = computed<ChartData<'line'>>(() => {
  if (!checks.value?.length) {
    return {
      labels: [],
      datasets: [],
    };
  }

  // Определяем цвета точек в зависимости от статуса
  const pointColors = checks.value.map((c) => {
    if (c.status === 0 || c.status >= 500) return 'rgb(239, 68, 68)'; // Красный для серверных ошибок
    if (c.status >= 400) return 'rgb(249, 115, 22)'; // Оранжевый для клиентских ошибок
    if (c.status >= 300) return 'rgb(234, 179, 8)'; // Желтый для редиректов
    return 'rgb(34, 197, 94)'; // Зеленый для успешных
  });

  return {
    labels: checks.value.map((c) => formatTime(c.timestamp)),
    datasets: [
      {
        label: 'Время ответа (мс)',
        data: checks.value.map((c) => c.responseTime),
        borderColor: 'rgb(59, 130, 246)', // Синий цвет (blue-500)
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3, // Плавность линии
        pointRadius: 5, // Увеличиваем размер точек для лучшей видимости
        pointHoverRadius: 8, // Размер точек при наведении
        pointBackgroundColor: pointColors, // Цвет точек зависит от статуса
        pointBorderColor: pointColors, // Цвет границы точек
        pointBorderWidth: 2, // Толщина границы точек
      },
    ],
  };
});

// Настройки графика
const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    title: {
      display: true,
      text: 'История проверок (последние 30)',
      font: {
        size: 16,
        weight: 'bold',
      },
    },
    tooltip: {
      callbacks: {
        // Кастомный формат тултипа
        label: (context) => {
          const check = checks.value?.[context.dataIndex];
          if (!check) return '';

          const statusEmoji =
            check.status === 0 || check.status >= 500
              ? '🔴'
              : check.status >= 400
                ? '🟠'
                : check.status >= 300
                  ? '🟡'
                  : '🟢';

          return [
            `${statusEmoji} HTTP статус: ${check.status || 'timeout'}`,
            `⏱️ Время ответа: ${check.responseTime} мс`,
            check.error ? `❌ Ошибка: ${check.error}` : '✅ Успешно',
          ].filter(Boolean);
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Время ответа (мс)',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Время проверки',
      },
      ticks: {
        maxRotation: 45,
        minRotation: 45,
      },
    },
  },
}));
</script>

<template>
  <div class="w-full">
    <!-- Скелетон пока загружаются данные -->
    <div v-if="pending" class="h-96 flex items-center justify-center">
      <USkeleton class="h-full w-full" />
    </div>

    <!-- Сообщение если нет данных -->
    <div
      v-else-if="!checks?.length"
      class="h-96 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg"
    >
      <div class="text-center">
        <p class="text-slate-600 dark:text-slate-400 text-lg">
          Нет данных для отображения
        </p>
        <p class="text-slate-500 dark:text-slate-500 text-sm mt-2">
          Статистика появится после первых проверок
        </p>
      </div>
    </div>

    <!-- График -->
    <div v-else class="space-y-4">
      <!-- Легенда статусов -->
      <div
        class="flex flex-wrap gap-4 justify-center text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg"
      >
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-green-500"></span>
          <span class="text-slate-600 dark:text-slate-400">2xx - Успешно</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span class="text-slate-600 dark:text-slate-400">3xx - Редирект</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-orange-500"></span>
          <span class="text-slate-600 dark:text-slate-400">4xx - Клиент</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-red-500"></span>
          <span class="text-slate-600 dark:text-slate-400"
            >5xx/timeout - Сервер</span
          >
        </div>
      </div>

      <!-- График -->
      <div class="h-96 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>
