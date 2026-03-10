---
title: Refunds API
description: Create and update refunds with the PayRex Laravel package.
---

# Refunds

Create refunds to return funds to a customer's payment method. Refunds are always associated with a specific payment.

::: info Partial and Full Refunds
You can issue a **full refund** for the entire payment amount, or a **partial refund** for a lesser amount. Multiple partial refunds can be issued against the same payment, as long as the total refunded does not exceed the original payment amount. The `amount_refunded` field on the payment tracks the cumulative refunded amount.
:::

::: warning QR Ph Payments
QR Ph (`qrph`) payments **do not support refunds**. See [Payment Methods — Refund Support](/guide/payment-methods#refund-support) for details.
:::

## Create a Refund

::: code-group

```php [Basic]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$refund = Payrex::refunds()->create([ // [!code focus:5]
    'payment_id' => 'pay_xxxxx', // Required
    'amount' => 10000,                                        // Required. cents
    'reason' => 'others',                                     // Required
]);
```

```php [With Enum & Details]
use LegionHQ\LaravelPayrex\Enums\RefundReason;
use LegionHQ\LaravelPayrex\Facades\Payrex;

$refund = Payrex::refunds()->create([
    'payment_id' => 'pay_xxxxx',
    'amount' => 10000,
    'reason' => RefundReason::Others->value, // [!code focus]
    'remarks' => 'The customer is disappointed about item XYZ.', // [!code focus]
]);
```

```php [With Metadata]
use LegionHQ\LaravelPayrex\Enums\RefundReason;
use LegionHQ\LaravelPayrex\Facades\Payrex;

$refund = Payrex::refunds()->create([
    'payment_id' => 'pay_xxxxx',
    'amount' => 10000,
    'reason' => RefundReason::RequestedByCustomer->value,
    'metadata' => [ // [!code focus:4]
        'ticket_id' => 'SUP-001',
        'agent' => 'admin@example.com',
    ],
]);
```

:::

**Returns a [Refund](#refund-resource) resource.**

**Example Response:**

```json
{
    "id": "re_xxxxx",
    "resource": "refund",
    "amount": 10000,
    "status": "succeeded",
    "currency": "PHP",
    "description": "",
    "reason": "others",
    "remarks": "The customer is disappointed about item XYZ.",
    "livemode": false,
    "metadata": null,
    "payment_id": "pay_xxxxx",
    "created_at": 1700407880,
    "updated_at": 1700407880
}
```

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `payment_id` | string | Yes | Payment to refund (`pay_` prefix) |
| `amount` | integer | Yes | Refund amount in cents |
| `reason` | string | Yes | Refund reason (see below) |
| `currency` | string | No | Defaults to config `PAYREX_CURRENCY`. Note: the PayRex API requires this field, but the package sends your configured default automatically. |
| `description` | string | No | Reference text |
| `remarks` | string | No | Visible in the PayRex dashboard |
| `metadata` | object | No | Key-value pairs |

### Available Reasons

A reason is required when creating a refund. Use the `RefundReason` enum for type safety:

| Enum | Value |
|---|---|
| `RefundReason::Fraudulent` | `fraudulent` |
| `RefundReason::RequestedByCustomer` | `requested_by_customer` |
| `RefundReason::ProductOutOfStock` | `product_out_of_stock` |
| `RefundReason::ServiceNotProvided` | `service_not_provided` |
| `RefundReason::ProductWasDamaged` | `product_was_damaged` |
| `RefundReason::ServiceMisaligned` | `service_misaligned` |
| `RefundReason::WrongProductReceived` | `wrong_product_received` |
| `RefundReason::Others` | `others` |

## Update a Refund

Update a refund's metadata:

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$refund = Payrex::refunds()->update('re_xxxxx', [
    'metadata' => ['ticket_id' => 'SUP-001', 'resolved' => 'true'],
]);
```

**Returns a [Refund](#refund-resource) resource.**

**Example Response:**

```json
{
    "id": "re_xxxxx",
    "resource": "refund",
    "amount": 10000,
    "status": "succeeded",
    "currency": "PHP",
    "description": "",
    "reason": "others",
    "remarks": "The customer is disappointed about item XYZ.",
    "livemode": false,
    "metadata": {
        "ticket_id": "SUP-001",
        "resolved": "true"
    },
    "payment_id": "pay_xxxxx",
    "created_at": 1700407880,
    "updated_at": 1700407900
}
```

## Refund Resource

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (`re_` prefix) |
| `resource` | string | Always `refund` |
| `amount` | integer | Refund amount in cents |
| `currency` | string | Three-letter ISO currency code |
| `status` | string | See [RefundStatus](/guide/enums#refundstatus) |
| `payment_id` | string | Associated payment ID |
| `reason` | string | Refund reason |
| `description` | string | Reference text |
| `remarks` | string\|null | Dashboard notes |
| `metadata` | object\|null | Key-value pairs |
| `livemode` | boolean | Live or test mode |
| `created_at` | integer | Unix timestamp |
| `updated_at` | integer | Unix timestamp |

### Refund Statuses

| Status | Description |
|---|---|
| `succeeded` | The refund was processed successfully and funds have been returned to the customer. |
| `pending` | The refund is being processed. Some refunds may require additional processing time depending on the payment method. Listen for the `refund.updated` webhook to get the final status. |
| `failed` | The refund could not be processed. This may occur if the payment method is no longer valid or the issuer declined the refund. |

::: tip Property Access
Response field names above are shown in `snake_case` (matching the raw API response). In PHP, access them as **camelCase** typed properties on the DTO — e.g., `payment_id` becomes `$refund->paymentId`. See [Response Data](/guide/response-data) for details.
:::

## Further Reading

- [Refunds Guide](/guide/refunds) — Full refund flow and best practices
- [Payments API](/api/payments) — Retrieve payments and check refund status
- [Payment Methods — Refund Support](/guide/payment-methods#refund-support) — Which methods support refunds
- [Webhook Handling](/guide/webhooks) — Handle `refund.created` and `refund.updated` events
