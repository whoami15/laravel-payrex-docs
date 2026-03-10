---
title: Billing Statements API
description: Create, manage, and send billing statements with the PayRex Laravel package.
---

# Billing Statements

Create and manage billing statements for your customers. Billing statements are one-time payment links that contain customer information, a due date, and an itemized list of products or services.

::: info Amounts in Cents
All monetary amounts are in **cents** (the smallest currency unit). For example, `100000` = **₱1,000.00**.
:::

## Create a Billing Statement

::: code-group

```php [Basic]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$statement = Payrex::billingStatements()->create([ // [!code focus:7]
    'customer_id' => $user->payrexCustomerId(), // or 'cus_xxxxx'
    'payment_settings' => [
        'payment_methods' => ['card', 'gcash'],
    ],
    'billing_details_collection' => 'always',
]);
```

```php [With Description]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$statement = Payrex::billingStatements()->create([
    'customer_id' => $user->payrexCustomerId(), // or 'cus_xxxxx'
    'description' => 'February 2026 Invoice', // [!code focus]
    'payment_settings' => [
        'payment_methods' => ['card', 'gcash', 'maya'],
    ],
]);
```

```php [With Metadata]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$statement = Payrex::billingStatements()->create([
    'customer_id' => $user->payrexCustomerId(), // or 'cus_xxxxx'
    'payment_settings' => [
        'payment_methods' => ['card', 'gcash'],
    ],
    'metadata' => ['invoice' => 'INV-001'], // [!code focus]
]);
```

:::

**Returns a [Billing Statement](#billing-statement-resource) resource.**

::: tip Billable Customer
If you've set up the [Billable Customer](/guide/billable-customer) trait, use `$user->payrexCustomerId()` instead of hardcoding the customer ID:
```php
'customer_id' => $request->user()->payrexCustomerId(),
```
:::

**Example Response:**

```json
{
    "id": "bstm_xxxxx",
    "resource": "billing_statement",
    "amount": 0,
    "currency": "PHP",
    "customer_id": "cus_xxxxx",
    "description": null,
    "status": "draft",
    "line_items": [],
    "livemode": false,
    "billing_statement_merchant_name": null,
    "billing_statement_number": null,
    "billing_statement_url": null,
    "finalized_at": null,
    "statement_descriptor": null,
    "customer": {
        "id": "cus_xxxxx",
        "name": "Juan Dela Cruz",
        "email": "juan@example.com"
    },
    "payment_intent": null,
    "metadata": null,
    "payment_settings": {
        "payment_methods": ["card", "gcash"]
    },
    "setup_future_usage": null,
    "billing_details_collection": "always",
    "due_at": null,
    "created_at": 1721726975,
    "updated_at": 1721726975
}
```

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `customer_id` | string | Yes | Customer ID (`cus_` prefix) |
| `currency` | string | No | Three-letter ISO currency code. Defaults to config `PAYREX_CURRENCY` |
| `description` | string | No | Reference text, copied to the payment intent on finalize |
| `billing_details_collection` | string | No | `always` or `auto` (default: `always`) |
| `metadata` | object | No | Key-value pairs, copied to the payment intent on finalize |
| `payment_settings` | object | No | Payment method configuration (see below) |
| `payment_settings.payment_methods` | array | No | Allowed methods: `card`, `gcash`, `maya`, `qrph`. Defaults to your account's enabled methods |
| `payment_settings.payment_method_options` | object | No | Modify payment method behavior (see below) |

### Payment Settings

```php
'payment_settings' => [
    'payment_methods' => ['card', 'gcash', 'maya'],
    'payment_method_options' => [
        'card' => [
            'allowed_bins' => ['123456', '654321'],
            'allowed_funding' => ['credit', 'debit'],
        ],
    ],
],
```

When creating, supported payment methods are: `card`, `gcash`, `maya`, and `qrph`. When updating, `billease` is also available. BDO Installment is not available for billing statements.

::: info Amount Limits
The total billing statement amount (sum of `line_items.quantity * line_items.unit_price`) must be between **₱20.00** (2,000 cents) and **₱59,999,999.99** (5,999,999,999 cents).
:::

::: info Draft Status
Newly created billing statements start in `draft` status. The `billing_statement_url` and `payment_intent` fields are `null` until you [finalize](#finalize-a-billing-statement) the statement, which transitions it to `open` and generates the payment link and associated payment intent.
:::

## List Billing Statements

```php
$statements = Payrex::billingStatements()->list(['limit' => 10]);

foreach ($statements->data as $statement) {
    echo "{$statement->id}: {$statement->status}";
}
```

**Returns a list of [Billing Statement](#billing-statement-resource) resources.**

**Example Response:**

```json
{
    "resource": "list",
    "data": [
        {
            "id": "bstm_xxxxx",
            "resource": "billing_statement",
            "amount": 100000,
            "currency": "PHP",
            "customer_id": "cus_xxxxx",
            "description": null,
            "status": "open",
            "billing_statement_url": "https://bill.payrexhq.com/b/test_bstm_xxxxx_secret_xxxxx",
            "billing_details_collection": "always",
            "due_at": 1721813375,
            "metadata": null,
            "livemode": false,
            "created_at": 1721726975,
            "updated_at": 1721726975
        },
        {
            "id": "bstm_yyyyy",
            "resource": "billing_statement",
            "amount": 250000,
            "currency": "PHP",
            "customer_id": "cus_yyyyy",
            "description": null,
            "status": "draft",
            "billing_statement_url": null,
            "billing_details_collection": "always",
            "due_at": 1721899775,
            "metadata": null,
            "livemode": false,
            "created_at": 1721727000,
            "updated_at": 1721727000
        }
    ],
    "has_more": false
}
```

### Pagination

```php
// In a controller — returns a CursorPaginator for UI pagination
$statements = Payrex::billingStatements()->paginate(perPage: 10);
```

See [Pagination](/guide/pagination) for more details on cursor-based pagination.

## Retrieve a Billing Statement

```php
$statement = Payrex::billingStatements()->retrieve('bstm_xxxxx');

echo $statement->amount;      // 100000
echo $statement->status;      // BillingStatementStatus::Open
echo $statement->customerId;  // 'cus_xxxxx'
echo $statement->customer->name;   // 'Juan Dela Cruz'
echo $statement->billingStatementUrl;         // 'https://bill.payrexhq.com/b/test_...'
```

**Returns a [Billing Statement](#billing-statement-resource) resource.**

## Update a Billing Statement

```php
$statement = Payrex::billingStatements()->update('bstm_xxxxx', [
    'description' => 'Website Maintenance — March 2026',
    'due_at' => now()->addDays(45)->timestamp,
    'payment_settings' => [
        'payment_methods' => ['card', 'gcash', 'maya', 'qrph'],
    ],
]);
```

**Returns a [Billing Statement](#billing-statement-resource) resource.**

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `customer_id` | string | No | Customer ID (`cus_` prefix) |
| `description` | string | No | Reference text, copied to the payment intent on finalize |
| `due_at` | integer | No | Payment deadline (Unix timestamp). Customers can still pay after this date |
| `billing_details_collection` | string | No | `always` or `auto` |
| `metadata` | object | No | Key-value pairs, copied to the payment intent on finalize |
| `payment_settings` | object | **Yes** | Payment method configuration. The PayRex API requires this field on every update request, even if you're only changing other fields like `description` or `due_at`. |
| `payment_settings.payment_methods` | array | No | Allowed methods: `card`, `gcash`, `maya`, `billease`, `qrph` |
| `payment_settings.payment_method_options` | object | No | Modify payment method behavior |

**Example Response:**

```json
{
    "id": "bstm_xxxxx",
    "resource": "billing_statement",
    "amount": 100000,
    "currency": "PHP",
    "description": "Website Maintenance — March 2026",
    "status": "open",
    "...": "..."
}
```

## Delete a Billing Statement

```php
Payrex::billingStatements()->delete('bstm_xxxxx');
```

**Returns a [Deleted Resource](/api/deleted-resource).**

**Example Response:**

```json
{
    "id": "bstm_xxxxx",
    "resource": "billing_statement",
    "deleted": true
}
```

## Finalize a Billing Statement

Finalize a draft billing statement to make it ready for payment. This transitions the status from `draft` to `open`, generates a payment URL, and creates the associated payment intent:

```php
$statement = Payrex::billingStatements()->finalize('bstm_xxxxx'); // [!code focus]

echo $statement->status;      // BillingStatementStatus::Open
echo $statement->billingStatementUrl;         // 'https://bill.payrexhq.com/b/test_...'
```

**Returns a [Billing Statement](#billing-statement-resource) resource.**

## Void a Billing Statement

```php
$statement = Payrex::billingStatements()->void('bstm_xxxxx');

echo $statement->status; // BillingStatementStatus::Void
```

**Returns a [Billing Statement](#billing-statement-resource) resource.**

**Example Response:**

```json
{
    "id": "bstm_xxxxx",
    "resource": "billing_statement",
    "status": "void",
    "payment_intent": null,
    "...": "..."
}
```

## Mark as Uncollectible

```php
$statement = Payrex::billingStatements()->markUncollectible('bstm_xxxxx');

echo $statement->status; // BillingStatementStatus::Uncollectible
```

**Returns a [Billing Statement](#billing-statement-resource) resource.**

## Send to Customer

Send the billing statement to the customer via email:

```php
$statement = Payrex::billingStatements()->send('bstm_xxxxx');
```

**Returns a [Billing Statement](#billing-statement-resource) resource.**

## Billing Statement Resource

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (`bstm_` prefix) |
| `resource` | string | Always `billing_statement` |
| `amount` | integer | Total amount in cents |
| `currency` | string | Three-letter ISO currency code |
| `customer_id` | string | Associated customer ID |
| `status` | string | See [BillingStatementStatus](/guide/enums#billingstatementstatus) |
| `description` | string\|null | Reference text |
| `billing_statement_url` | string\|null | Customer payment link (available when status is `open`) |
| `billing_statement_merchant_name` | string\|null | Merchant name on the statement |
| `billing_statement_number` | string\|null | Statement number (e.g. `A3EAXLGV-0001`) |
| `billing_details_collection` | string\|null | Billing info collection mode |
| `due_at` | integer\|null | Payment deadline (Unix timestamp) |
| `finalized_at` | integer\|null | Timestamp when the statement was finalized |
| `statement_descriptor` | string\|null | Statement descriptor |
| `line_items` | array\|null | Array of [BillingStatementLineItem](/api/billing-statement-line-items) DTOs |
| `customer` | string\|[Customer](/api/customers)\|null | Associated customer (string ID or expanded `Customer` object) |
| `payment_intent` | string\|[PaymentIntent](/api/payment-intents)\|null | Payment intent (string ID or expanded `PaymentIntent` object) |
| `payment_settings` | object\|null | Payment method configuration |
| `setup_future_usage` | string\|null | Indicates if the payment method should be saved for future use |
| `metadata` | object\|null | Key-value pairs |
| `livemode` | boolean\|null | Live or test mode (`null` on expanded relations where the API omits it) |
| `created_at` | integer | Unix timestamp |
| `updated_at` | integer | Unix timestamp |

### Billing Statement Statuses

See [Billing Statements Guide — Lifecycle](/guide/billing-statements-guide#lifecycle) for the full status lifecycle diagram.

| Status | Description |
|---|---|
| `draft` | The billing statement is being prepared. Line items, payment settings, and other details can still be modified. |
| `open` | The billing statement has been finalized and a payment URL is generated. It is now awaiting payment from the customer. |
| `paid` | The customer has successfully paid the billing statement. |
| `void` | The billing statement has been voided and is no longer payable. Use this for statements issued in error. |
| `uncollectible` | The billing statement has been marked as uncollectible. Use this when payment is unlikely to be received. |
| `overdue` | The billing statement is past its due date and has not been paid. |

::: warning Line Item Mutability
Line items can only be added, updated, or deleted while the billing statement is in `draft` status. Once finalized to `open`, line items are locked and cannot be modified.
:::

::: tip Property Access
Response field names above are shown in `snake_case` (matching the raw API response). In PHP, access them as **camelCase** typed properties on the DTO — e.g., `billing_statement_url` becomes `$statement->billingStatementUrl`. See [Response Data](/guide/response-data) for details.
:::

## Further Reading

- [Billing Statement Line Items API](/api/billing-statement-line-items) — Create, update, and delete line items
- [Billing Statements Guide](/guide/billing-statements-guide) — Step-by-step billing statements guide
- [Customers API](/api/customers) — Manage customer records
- [Billable Customer](/guide/billable-customer) — Link your User model to PayRex customers
- [Webhook Handling](/guide/webhooks) — Handle billing statement events
