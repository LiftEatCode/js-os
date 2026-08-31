# Payments integration

**Status:** Planned. Not implemented.

## Purpose

Inform Finance and CEO review with money-movement events. JS OS is not the accounting ledger unless ownership is later transferred.

## System of record

The payments/accounting provider remains canonical for charges, invoices, and payouts until explicitly changed.

## Data JS OS may read

Payment/invoice identifiers, amounts, statuses — as events and pointers (`sourceType = PAYMENTS`). Do not invent a chart of accounts here.

## Actions JS OS may eventually request

Record a BusinessEvent from a webhook. Charge, refund, or pay only through tools plus approval.

## Expected approval considerations

Spend and refunds require owner approval. See [finance](../departments/finance.md) and [approval policy](../policies/approvals.md).

## Implementation status

Planned. Enum `PAYMENTS` is reserved. No Stripe or bank connection.
