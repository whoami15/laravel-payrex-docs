---
title: Refunds
description: Refund payments to return funds to your customer's original payment method with PayRex in Laravel.
---

# Refunds

Refund a payment to return funds to your customer's original payment method. Refunds are always tied to a specific payment — you need the payment ID (`pay_` prefix) to create one.

::: warning QR Ph Payments
QR Ph (`qrph`) payments **do not support refunds**. Attempting to refund a QR Ph payment will result in an error. If you need to return funds for a QR Ph payment, you must arrange this outside of PayRex.
:::

## Creating a Refund

Every refund requires three things: the payment ID, the amount (in cents), and a reason.

### Full Refund

Refund the entire payment amount:

```php
use LegionHQ\LaravelPayrex\Enums\RefundReason;
use LegionHQ\LaravelPayrex\Facades\Payrex;

$payment = Payrex::payments()->retrieve('pay_xxxxx');

$refund = Payrex::refunds()->create([ // [!code focus:5]
    'payment_id' => $payment->id,
    'amount' => $payment->amount,                    // Full amount
    'reason' => RefundReason::RequestedByCustomer->value,
]);
```

### Partial Refund

Refund less than the full amount. You can issue multiple partial refunds against the same payment, as long as the total doesn't exceed the original amount:

```php
use LegionHQ\LaravelPayrex\Enums\RefundReason;
use LegionHQ\LaravelPayrex\Facades\Payrex;

// Refund ₱50.00 of a ₱100.00 payment
$refund = Payrex::refunds()->create([ // [!code focus:6]
    'payment_id' => 'pay_xxxxx',
    'amount' => 5000,
    'reason' => RefundReason::ProductWasDamaged->value,
    'remarks' => 'Item arrived with a cracked screen.',
]);
```

::: tip Tracking refunded amounts
The `amount_refunded` field on the [Payment](/api/payments) object tracks the cumulative refunded amount. The `refunded` boolean becomes `true` once any refund is issued. Retrieve the payment to check:
```php
$payment = Payrex::payments()->retrieve('pay_xxxxx');
$payment->amountRefunded; // 5000 — total refunded so far
$payment->refunded;       // true
```
:::

### Available Reasons

A reason is required when creating a refund. Use the `RefundReason` enum for type safety:

```php
use LegionHQ\LaravelPayrex\Enums\RefundReason;

RefundReason::RequestedByCustomer->value; // 'requested_by_customer'
RefundReason::Fraudulent->value;          // 'fraudulent'
RefundReason::ProductWasDamaged->value;   // 'product_was_damaged'
RefundReason::Others->value;              // 'others'
// ... and 4 more
```

See [Refunds API — Available Reasons](/api/refunds#available-reasons) for the full list of values.

## Refund Status

Refunds can be in one of three states:

| Status | Description |
|---|---|
| `succeeded` | Funds have been returned to the customer. |
| `pending` | The refund is being processed. Typical for non-card payment methods. |
| `failed` | The refund could not be processed (e.g. payment method is no longer valid). |

```php
use LegionHQ\LaravelPayrex\Enums\RefundStatus;

if ($refund->status === RefundStatus::Succeeded) {
    // Refund completed
}
```

## Webhook Events

PayRex sends webhook events when refunds are created or updated:

| Event | When |
|---|---|
| `refund.created` | A new refund is created. |
| `refund.updated` | A refund's status changes (e.g. `pending` → `succeeded` or `pending` → `failed`). |

```php
use Illuminate\Support\Facades\Event;
use LegionHQ\LaravelPayrex\Enums\RefundStatus;
use LegionHQ\LaravelPayrex\Events\RefundCreated;
use LegionHQ\LaravelPayrex\Events\RefundUpdated;

Event::listen(RefundCreated::class, function (RefundCreated $event) { // [!code focus:6]
    /** @var Refund $refund */
    $refund = $event->data();

    // Log the refund, notify the customer, etc.
});

Event::listen(RefundUpdated::class, function (RefundUpdated $event) { // [!code focus:8]
    /** @var Refund $refund */
    $refund = $event->data();

    if ($refund->status === RefundStatus::Failed) {
        // Alert support team — refund failed
    }
});
```

## Updating a Refund

You can update a refund's metadata after creation:

```php
$refund = Payrex::refunds()->update('re_xxxxx', [
    'metadata' => ['ticket_id' => 'SUP-001', 'resolved' => 'true'],
]);
```

## Further Reading

- [Refunds API](/api/refunds) — Full parameter and response reference
- [Payments API](/api/payments) — Retrieve payments and check `amount_refunded`
- [Webhook Handling](/guide/webhooks) — Set up event listeners for refund notifications
- [Enums](/guide/enums#refundreason) — All refund reason values
