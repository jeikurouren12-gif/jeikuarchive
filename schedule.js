export function getNextDailyRunMs(hour = 4, minute = 30, now = new Date()) {
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

export function shouldRunDailyImport(now = new Date(), hour = 4, minute = 30) {
  return now.getHours() === hour && now.getMinutes() === minute && now.getSeconds() === 0;
}
