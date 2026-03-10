---
title: Payment Methods
description: Available payment methods in PayRex - cards, GCash, Maya, BillEase, QR Ph, and BDO Installment.
---

# Payment Methods

PayRex supports multiple payment methods popular in the Philippines. You specify which methods to accept when creating a [Payment Intent](/api/payment-intents) or [Checkout Session](/guide/checkout-sessions-guide) — PayRex handles the rest.

## Specifying Payment Methods

Pass an array of payment method strings when creating a payment:

::: code-group

```php [Payment Intent]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$paymentIntent = Payrex::paymentIntents()->create([
    'amount' => 10000,
    'payment_methods' => ['card', 'gcash', 'maya', 'qrph'],
]);
```

```php [Checkout Session]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$session = Payrex::checkoutSessions()->create([
    'line_items' => [
        ['name' => 'Wireless Bluetooth Headphones', 'amount' => 250000, 'quantity' => 1],
    ],
    'payment_methods' => ['card', 'gcash', 'maya', 'qrph'],
    'success_url' => route('checkout.success'),
    'cancel_url' => route('checkout.cancel'),
]);
```

```php [With Enum]
use LegionHQ\LaravelPayrex\Enums\PaymentMethod;
use LegionHQ\LaravelPayrex\Facades\Payrex;

$paymentIntent = Payrex::paymentIntents()->create([
    'amount' => 10000,
    'payment_methods' => [
        PaymentMethod::Card->value,
        PaymentMethod::GCash->value,
        PaymentMethod::Maya->value,
    ],
]);
```

:::

PayRex displays the available payment methods to the customer based on this array. The customer picks one and completes payment — the backend flow (webhooks, status transitions) is the same regardless of which method they choose.

## Available Methods

| Method | Value | Description |
|---|---|---|
| Card | `card` | Credit and debit cards. Supports [Hold then Capture](/guide/hold-then-capture). |
| GCash | `gcash` | Philippines' leading e-wallet. Customer authorizes via the GCash app. |
| Maya | `maya` | Digital payments via the Maya app. |
| QR Ph | `qrph` | QR code payments via the BSP QR Ph standard. Customer scans with any participating bank app. **Does not support refunds.** |
| BillEase | `billease` | Buy now, pay later. Customer applies for installment terms during checkout. |
| BDO Installment | `bdo_installment` | Installment payments via BDO credit cards. Requires activation for live mode. |

### Google Pay

Google Pay is available for web and mobile but is **not a separate `payment_methods` value**. If you have already integrated the `card` payment method, there is no additional code change needed. Enable Google Pay from the [PayRex Dashboard](https://dashboard.payrexhq.com) under **Settings > Payment Methods**, and the Google Pay widget will appear alongside your card payment integration automatically.

::: info
Google Pay is currently in **closed beta** — contact PayRex to enable it on your account.
:::

::: tip
You don't need separate integration code for each payment method. The only difference is the strings you pass in `payment_methods`. PayRex handles the method-specific UX (redirects, QR codes, app authorization, etc.) automatically.
:::

## Refund Support

Not all payment methods support refunds. See [Refunds](/guide/refunds) for the full refund flow.

| Method | Refund Supported |
|---|---|
| Card | Yes |
| GCash | Yes |
| Maya | Yes |
| QR Ph | **No** |
| BillEase | Yes |
| BDO Installment | Yes |

## Card-Specific Features

Card payments support additional options via `payment_method_options`:

```php
$paymentIntent = Payrex::paymentIntents()->create([
    'amount' => 10000,
    'payment_methods' => ['card'],
    'payment_method_options' => [
        'card' => [
            'capture_type' => 'manual',    // Hold then capture (default: 'automatic')
            'allowed_bins' => [],           // Restrict to specific card BINs
            'allowed_funding' => [],        // Restrict to specific funding types (e.g., 'credit', 'debit')
        ],
    ],
]);
```

See [Hold then Capture](/guide/hold-then-capture) for the full manual capture flow.

## BDO Installment Options

BDO Installment payments support installment type and term configuration via `payment_method_options`:

```php
$paymentIntent = Payrex::paymentIntents()->create([
    'amount' => 50000,
    'payment_methods' => ['bdo_installment'],
    'payment_method_options' => [
        'bdo_installment' => [
            'installment_types' => ['regular', 'zero'],
            'payment_terms' => [3, 6, 12],
        ],
    ],
]);
```

### Installment Types

| Value | Description |
|---|---|
| `regular` | Regular installment with interest |
| `zero` | Zero-interest installment |
| `regular_holiday` | Regular installment with holiday terms |
| `zero_holiday` | Zero-interest installment with holiday terms |

### Payment Terms

Available terms (in months): `3`, `6`, `9`, `12`, `18`, `24`, `36`

::: info
BDO Installment requires activation for live mode. Contact PayRex to enable it on your account.
:::

## PayRex Documentation

For method-specific details — merchant requirements, customer experience, supported currencies, and limitations — see the official PayRex documentation:

- [Card Payments](https://docs.payrex.com/docs/guide/developer_handbook/payments/payment_methods/card/)
- [GCash](https://docs.payrex.com/docs/guide/developer_handbook/payments/payment_methods/gcash/)
- [Maya](https://docs.payrex.com/docs/guide/developer_handbook/payments/payment_methods/maya/)
- [QR Ph](https://docs.payrex.com/docs/guide/developer_handbook/payments/payment_methods/qrph/)
- [BillEase](https://docs.payrex.com/docs/guide/developer_handbook/payments/payment_methods/billease/)
- [BDO Installment](https://docs.payrex.com/docs/guide/developer_handbook/payments/payment_methods/bdo_installment/)
- [Google Pay](https://docs.payrex.com/docs/guide/developer_handbook/payments/payment_methods/googlepay/)

## Further Reading

- [Accept a Payment](/guide/accept-a-payment) — Standard payment flow
- [Checkout Sessions](/guide/checkout-sessions-guide) — PayRex-hosted payment page
- [Hold then Capture](/guide/hold-then-capture) — Authorize and capture card payments
- [Refunds](/guide/refunds) — Refund flow and which methods support it
- [Enums — PaymentMethod](/guide/enums#paymentmethod) — All payment method enum values
