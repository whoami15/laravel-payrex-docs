---
title: Billing Statement Line Items API
description: Create, update, and delete billing statement line items with the PayRex Laravel package.
---

# Billing Statement Line Items

Manage individual line items on a billing statement. Line items can only be added, updated, or deleted while the billing statement is in `draft` status. Once finalized to `open`, line items are locked.

::: info Amounts in Cents
All monetary amounts are in **cents** (the smallest currency unit). For example, `10000` = **₱100.00**.
:::

## Create a Line Item

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$lineItem = Payrex::billingStatementLineItems()->create([ // [!code focus:6]
    'billing_statement_id' => 'bstm_xxxxx', // Required
    'description' => 'Web Development Services — March 2026', // Required
    'unit_price' => 2500000,            // Required. Amount in cents (₱25,000.00)
    'quantity' => 1,                    // Required
]);
```

**Returns a [Billing Statement Line Item](#billing-statement-line-item-resource) resource.**

**Example Response:**

```json
{
    "id": "bstm_li_xxxxx",
    "resource": "billing_statement_line_item",
    "description": "Web Development Services — March 2026",
    "unit_price": 2500000,
    "quantity": 1,
    "billing_statement_id": "bstm_xxxxx",
    "livemode": false,
    "created_at": 1721726975,
    "updated_at": 1721726975
}
```

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `billing_statement_id` | string | Yes | Parent billing statement ID (`bstm_` prefix) |
| `description` | string | Yes | Line item description (e.g., product name or service) |
| `unit_price` | integer | Yes | Price per unit in cents |
| `quantity` | integer | Yes | Number of units |

## Update a Line Item

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$lineItem = Payrex::billingStatementLineItems()->update('bstm_li_xxxxx', [
    'description' => 'Monthly Hosting (Pro Plan)',
    'unit_price' => 150000,
    'quantity' => 3,
]);
```

**Returns a [Billing Statement Line Item](#billing-statement-line-item-resource) resource.**

**Example Response:**

```json
{
    "id": "bstm_li_xxxxx",
    "resource": "billing_statement_line_item",
    "description": "Monthly Hosting (Pro Plan)",
    "unit_price": 150000,
    "quantity": 3,
    "billing_statement_id": "bstm_xxxxx",
    "livemode": false,
    "created_at": 1721726975,
    "updated_at": 1721727100
}
```

## Delete a Line Item

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

Payrex::billingStatementLineItems()->delete('bstm_li_xxxxx');
```

**Returns a [Deleted Resource](/api/deleted-resource).**

**Example Response:**

```json
{
    "id": "bstm_li_xxxxx",
    "resource": "billing_statement_line_item",
    "deleted": true
}
```

## Billing Statement Line Item Resource

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (`bstm_li_` prefix) |
| `resource` | string | Always `billing_statement_line_item` |
| `description` | string | Line item description |
| `unit_price` | integer | Price per unit in cents |
| `quantity` | integer | Number of units |
| `billing_statement_id` | string | Parent billing statement ID |
| `livemode` | boolean | Live or test mode |
| `created_at` | integer | Unix timestamp |
| `updated_at` | integer | Unix timestamp |

::: tip Property Access
Response field names above are shown in `snake_case` (matching the raw API response). In PHP, access them as **camelCase** typed properties on the DTO — e.g., `unit_price` becomes `$lineItem->unitPrice`. See [Response Data](/guide/response-data) for details.
:::

## Further Reading

- [Billing Statements API](/api/billing-statements) — Create and manage billing statements
- [Billing Statements Guide](/guide/billing-statements-guide) — Step-by-step billing statements guide
- [Webhook Handling](/guide/webhooks) — Handle billing statement line item events
