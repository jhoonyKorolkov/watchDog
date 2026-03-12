export default defineEventHandler(async (event) => {
  const sites = await db.query.sites.findMany({
    // Исключаем мягко удалённые сайты (deletedAt != null)
    where: (site, { eq, isNull, and }) =>
      and(eq(site.isActive, 1), isNull(site.deletedAt)),
    with: {
      checks: {
        orderBy: (check, { desc }) => desc(check.timestamp),
        limit: 1,
      },
    },
  });

  return sites;
});
