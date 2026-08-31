# Finance

**Implementation status:** planned

## Purpose

Track money movement and financial risk. JS OS is not the accounting system of record until an explicit finance integration says so.

## Responsibilities

- Surface cash, spend, and refund-related work
- Require approval for spending and refunds
- Later consume payments/provider data without becoming a shadow ledger unless ownership is transferred

## Inputs

Goals (revenue), future payments events, Approvals with financial payload.

## Outputs

WorkItems (`ADMIN` / `DECISION`), Approval requests, BusinessEvents such as invoice/payment types when integrated.

## Key metrics

Revenue, expenses, profitability — not sourced in JS OS today. Do not invent numbers.

## Decisions it may eventually make

Recommend spend vs hold. Not: issue refunds or pay invoices without approval.

## Collaboration

CEO (goals), Sales (close), Client Operations (delivery vs billable), Engineering (infra cost later).

## Current implementation status

AgentRole `FINANCE` exists. No payments integration.
