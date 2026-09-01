import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sortApprovals } from './ordering.ts';

const requested = Temporal.Instant.from('2026-08-20T00:00:00Z');
const older = Temporal.Instant.from('2026-08-10T00:00:00Z');
const newer = Temporal.Instant.from('2026-08-30T00:00:00Z');

describe('Approval list ordering', () => {
  it('places PENDING first, then risk, then oldest requestedAt', () => {
    const sorted = sortApprovals([
      {
        status: 'APPROVED',
        riskLevel: 'CRITICAL',
        requestedAt: older,
        decidedAt: newer,
      },
      {
        status: 'PENDING',
        riskLevel: 'LOW',
        requestedAt: requested,
        decidedAt: null,
      },
      {
        status: 'PENDING',
        riskLevel: 'CRITICAL',
        requestedAt: newer,
        decidedAt: null,
      },
      {
        status: 'PENDING',
        riskLevel: 'CRITICAL',
        requestedAt: older,
        decidedAt: null,
      },
      {
        status: 'PENDING',
        riskLevel: 'HIGH',
        requestedAt: older,
        decidedAt: null,
      },
    ]);

    assert.deepEqual(
      sorted.map((row) => `${row.status}:${row.riskLevel}:${row.requestedAt.toString()}`),
      [
        `PENDING:CRITICAL:${older.toString()}`,
        `PENDING:CRITICAL:${newer.toString()}`,
        `PENDING:HIGH:${older.toString()}`,
        `PENDING:LOW:${requested.toString()}`,
        `APPROVED:CRITICAL:${older.toString()}`,
      ],
    );
  });

  it('orders terminal records by most recently decided', () => {
    const sorted = sortApprovals([
      {
        status: 'REJECTED',
        riskLevel: 'LOW',
        requestedAt: older,
        decidedAt: older,
      },
      {
        status: 'APPROVED',
        riskLevel: 'HIGH',
        requestedAt: requested,
        decidedAt: newer,
      },
      {
        status: 'CANCELLED',
        riskLevel: 'MEDIUM',
        requestedAt: newer,
        decidedAt: requested,
      },
    ]);

    assert.deepEqual(
      sorted.map((row) => row.status),
      ['APPROVED', 'CANCELLED', 'REJECTED'],
    );
  });
});
