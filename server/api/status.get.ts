export default defineEventHandler(async (event) => {
  const storage = useStorage('cache');
  const cachedData = await storage.getItem('sites:status');

  if (cachedData) {
    return cachedData;
  }

  console.log('📊 Данные из БД (кэш пуст)');
  const sites = await db.query.sites.findMany({
    where: (site, { isNull }) => isNull(site.deletedAt),
    with: {
      checks: {
        orderBy: (check, { desc }) => desc(check.timestamp),
        limit: 1,
      },
    },
  });

  await storage.setItem('sites:status', sites);
  console.log('💾 Результат сохранен в кэш');

  return sites;
});
