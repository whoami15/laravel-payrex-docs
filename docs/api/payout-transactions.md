---
title: Payout Transactions API
description: List and paginate payout transaction line items - payments, refunds, and adjustments within a specific PayRex payout.
---

# Payout Transactions

Payout transactions represent every line item of a payout. Every payout transaction belongs to a payout resource. Payouts are transfers of funds from your PayRex account to your bank account — they are initiated by PayRex based on your settlement schedule.

::: info Read-Only Resource
Payout transactions are read-only. You can list the transactions within a specific payout, but you cannot create, update, or delete them.
:::

## List Payout Transactions

List all transactions within a specific payout. Note that unlike other list methods, `payoutTransactions->list()` requires a payout ID as the first argument:

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$transactions = Payrex::payoutTransactions()->list('po_xxxxx', [ // [!code focus:3]
    'limit' => 10,
]);

foreach ($transactions->data as $transaction) {
    echo $transaction->transactionType;  // PayoutTransactionType::Payment (enum)
    echo $transaction->amount;           // Amount in cents
    echo $transaction->netAmount;        // Net amount after fees
    echo $transaction->transactionId;    // The related payment/refund ID
}
```

**Returns a list of [Payout Transaction](#payout-transaction-resource) resources.**

**Example Response:**

```json
{
    "resource": "list",
    "has_more": false,
    "data": [
        {
            "id": "po_txn_xxxxx",
            "resource": "payout_transaction",
            "amount": 4569600,
            "net_amount": 2664200,
            "transaction_id": "pay_xxxxx",
            "transaction_type": "payment",
            "created_at": 1747235098,
            "updated_at": 1747263620
        },
        {
            "id": "po_txn_yyyyy",
            "resource": "payout_transaction",
            "amount": -500000,
            "net_amount": -500000,
            "transaction_id": "re_xxxxx",
            "transaction_type": "refund",
            "created_at": 1747235200,
            "updated_at": 1747263700
        }
    ]
}
```

### Pagination Parameters

| Parameter | Type | Description |
|---|---|---|
| `limit` | int | Number of items to return |
| `after` | string | Return items after this resource ID (forward pagination) |
| `before` | string | Return items before this resource ID (backward pagination) |

### Pagination

Payout transactions use manual cursor pagination via `list()` — the `paginate()` convenience method is not available for this resource because it requires a payout ID:

```php
// Manual cursor pagination
$page1 = Payrex::payoutTransactions()->list('po_xxxxx', ['limit' => 10]);

if ($page1->hasMore) {
    $lastId = end($page1->data)->id;
    $page2 = Payrex::payoutTransactions()->list('po_xxxxx', ['limit' => 10, 'after' => $lastId]);
}
```

See [Pagination](/guide/pagination) for more details on cursor-based pagination.

## Payout Transaction Resource

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (`po_txn_` prefix) |
| `resource` | string | Always `payout_transaction` |
| `amount` | integer | Transaction amount in cents (negative for refunds) |
| `net_amount` | integer | Net amount after fees in cents |
| `transaction_id` | string | The related payment (`pay_`) or refund (`re_`) ID |
| `transaction_type` | [PayoutTransactionType](/guide/enums#payouttransactiontype) | `payment`, `refund`, or `adjustment` (enum) |
| `created_at` | integer | Unix timestamp |
| `updated_at` | integer | Unix timestamp |

::: tip Property Access
Response field names above are shown in `snake_case` (matching the raw API response). In PHP, access them as **camelCase** typed properties on the DTO — e.g., `transaction_type` becomes `$transaction->transactionType`. See [Response Data](/guide/response-data) for details.
:::

### Transaction Types

| Type | Description | Amount |
|---|---|---|
| `payment` | A successful payment included in the payout | Positive |
| `refund` | A refund deducted from the payout | Negative |
| `adjustment` | A platform adjustment (e.g., fee corrections, manual adjustments) | Positive or negative |

## Payouts vs. Payout Transactions

The PayRex API has two related resources:

- **Payouts** — Represent the overall transfer of funds from your PayRex account to your bank account. Payouts are initiated by PayRex based on your settlement schedule and are managed through the [PayRex Dashboard](https://dashboard.payrexhq.com). This package does not wrap the Payouts resource directly.
- **Payout Transactions** — The individual line items within a payout (payments and refunds). This is what this page documents.

To view your payouts, use the PayRex Dashboard or the payout ID (`po_` prefix) to list its transactions via this package.

::: info Events Resource
PayRex also has an **Events** API for fetching event history. This package doesn't wrap it — use [webhook listeners](/guide/webhooks) instead, which give you the same data in real time with typed event classes.
:::

## Further Reading

- [Pagination](/guide/pagination) — Paginate through transaction lists
- [Webhook Handling](/guide/webhooks) — Handle `payout.deposited` events
