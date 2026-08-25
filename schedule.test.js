import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextDailyRunMs } from './schedule.js';

test('next daily run is calculated for 4:30am', () => {
  const now = new Date('2026-08-25T10:00:00Z');
  const ms = getNextDailyRunMs(4, 30, now);
  const expected = new Date('2026-08-26T04:30:00Z').getTime() - now.getTime();

  assert.equal(ms, expected);
});

test('next daily run is in the future for same-day time', () => {
  const now = new Date('2026-08-25T03:00:00Z');
  const ms = getNextDailyRunMs(4, 30, now);

  assert.ok(ms > 0);
  assert.ok(ms < 24 * 60 * 60 * 1000);
});
