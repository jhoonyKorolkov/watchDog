/**
 * Client middleware для защиты страниц.
 * Проверяет наличие активной сессии и перенаправляет на страницу логина при необходимости.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Публичные страницы, доступные без авторизации
  const publicPages = ['/login'];

  // Если страница публичная, пропускаем проверку
  if (publicPages.includes(to.path)) {
    return;
  }

  // Получаем состояние сессии
  const { loggedIn } = useUserSession();

  // Если пользователь не авторизован, перенаправляем на страницу логина
  if (!loggedIn.value) {
    return navigateTo('/login');
  }
});
