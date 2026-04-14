export function assertDevelopmentOnly(featureName = 'Этот endpoint'): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  throw createError({
    statusCode: 403,
    statusMessage: `${featureName} доступен только в режиме разработки`,
  });
}
