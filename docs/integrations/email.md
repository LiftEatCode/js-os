# Email integration

**Status:** Planned. Not implemented.

## Purpose

Let JS OS draft and, later, send operational email (owner, clients, prospects) through an explicit tool.

## System of record

The mailbox/provider is canonical for sent and received messages. JS OS stores WorkItems, Approvals, and optional `sourceId` pointers.

## Data JS OS may read

Message identifiers, thread metadata, and later summarized inbound mail relevant to work. No provider is selected.

## Actions JS OS may eventually request

Draft messages (`PREPARE`). Send only after permission check and approval for external recipients.

## Expected approval considerations

Outbound/external email is a consequential communication. See [communications policy](../policies/communications.md).

## Implementation status

Planned. Enum `EMAIL` is reserved. No SMTP, Gmail, or similar client.
