---
title: Payment Intents API
description: Create, retrieve, cancel, and capture payment intents with the PayRex Laravel package.
---

# Payment Intents

Payment intents track the lifecycle of a payment from creation to completion. A payment intent must be created before a customer can pay.

## Create a Payment Intent

::: code-group

```php [Basic]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$paymentIntent = Payrex::paymentIntents()->create([ // [!code focus:4]
    'amount' => 10000,                              // Required. Amount in cents (₱100.00)
    'payment_methods' => ['card', 'gcash'],         // Allowed payment methods
]);
```

```php [With Customer]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$paymentIntent = Payrex::paymentIntents()->create([
    'amount' => 10000,
    'description' => 'ORD-2026-0042',
    'customer_id' => $user->payrexCustomerId(), // [!code focus]
    'statement_descriptor' => 'MYSTORE',
]);
```

```php [With Metadata]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$paymentIntent = Payrex::paymentIntents()->create([
    'amount' => 10000,
    'metadata' => [ // [!code focus:4]
        'order_id' => (string) $order->id,
        'user_id' => (string) $request->user()->id,
    ],
]);
```

:::

**Returns a [Payment Intent](#payment-intent-resource) resource.**

::: tip Billable Customer
If you've set up the [Billable Customer](/guide/billable-customer) trait, use `$user->payrexCustomerId()` instead of hardcoding the customer ID:
```php
'customer_id' => $request->user()->payrexCustomerId(),
```
:::

::: info Default Currency
The `currency` parameter defaults to your configured `PAYREX_CURRENCY` (default: `PHP`). You can omit it unless you need to override it.
:::

**Example Response:**

```json
{
    "id": "pi_xxxxx",
    "resource": "payment_intent",
    "amount": 10000,
    "amount_received": 0,
    "amount_capturable": 0,
    "client_secret": "pi_xxxxx_secret_xxxxx",
    "currency": "PHP",
    "description": "",
    "last_payment_error": null,
    "latest_payment": null,
    "livemode": false,
    "metadata": null,
    "next_action": null,
    "payment_method_options": {
        "card": {
            "capture_type": "automatic"
        }
    },
    "payment_methods": ["card", "gcash"],
    "statement_descriptor": null,
    "status": "awaiting_payment_method",
    "payment_method_id": null,
    "return_url": null,
    "capture_before_at": null,
    "customer": null,
    "created_at": 1700407880,
    "updated_at": 1700407880
}
```

::: info next_action
`next_action` is `null` when the payment intent is first created. It gets populated when the status transitions to `awaiting_next_action` — for example, when a customer needs to be redirected to a 3D Secure page or a payment provider's authorization page.
:::

### Parameters

::: info Amount Limits
The `amount` must be between **₱20.00** (2,000 cents) and **₱59,999,999.99** (5,999,999,999 cents).
:::

| Parameter | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | Yes | Amount in cents (₱100.00 = `10000`). Min: 2,000, Max: 5,999,999,999. |
| `payment_methods` | array | No | Allowed methods: `card`, `gcash`, `maya`, `billease`, `qrph`, `bdo_installment`. If omitted, defaults to all enabled payment methods on your PayRex merchant account. |
| `currency` | string | No | Defaults to config `PAYREX_CURRENCY`. Note: the PayRex API requires this field, but the package sends your configured default automatically. |
| `description` | string | No | Reference text |
| `statement_descriptor` | string | No | Text on customer's bank statement |
| `metadata` | object | No | Key-value pairs for your use |
| `customer_id` | string | No | Associated customer ID (`cus_` prefix) |
| `payment_method_options` | object | No | Payment method configuration (see below) |

### Payment Method Options

```php
'payment_method_options' => [
    'card' => [
        'capture_type' => 'automatic',  // 'automatic' (default) or 'manual' (hold then capture)
        'allowed_bins' => [],            // Restrict to specific card BINs
        'allowed_funding' => [],         // Restrict to specific funding types
    ],
],
```

### Hold then Capture Flow

By default, payments are captured automatically when the customer completes payment. With **hold then capture**, the customer's card is authorized (funds are held) but not charged immediately. You then capture the held amount later when you're ready — for example, after confirming inventory, verifying an order, or shipping a product.

This is **card-only**. If you include other payment methods alongside card (e.g. `['card', 'gcash']`), the card payment will use hold-then-capture while the other methods will process as normal automatic capture.

::: warning Capture Deadline
Authorizations expire in **7 days**. You must capture the authorized amount before `capture_before_at` (returned in the response). If the deadline passes, the authorization expires — the payment intent is canceled and the held funds are released back to the customer.
:::

```php
// 1. Create with hold then capture
$paymentIntent = Payrex::paymentIntents()->create([
    'amount' => 10000,
    'payment_methods' => ['card'],
    'payment_method_options' => [ // [!code focus:3]
        'card' => ['capture_type' => 'manual'],
    ],
]);

// 2. Customer authorizes → status becomes 'awaiting_capture'
//    (async step — use the PaymentIntentAmountCapturable webhook event
//    or retrieve the payment intent to get the current amountCapturable)

// 3. Capture the authorized amount (must be ≤ amountCapturable)
$paymentIntent = Payrex::paymentIntents()->capture('pi_xxxxx', [ // [!code focus:3]
    'amount' => 10000,
]);

// Or capture a partial amount
$paymentIntent = Payrex::paymentIntents()->capture('pi_xxxxx', [ // [!code focus:3]
    'amount' => 5000, // Capture ₱50.00 of the authorized ₱100.00
]);
```

## Retrieve a Payment Intent

```php
$paymentIntent = Payrex::paymentIntents()->retrieve('pi_xxxxx');

echo $paymentIntent->amount;             // 10000
echo $paymentIntent->amountReceived;     // 10000
echo $paymentIntent->status;             // PaymentIntentStatus::Succeeded
echo $paymentIntent->clientSecret;       // 'pi_xxxxx_secret_xxxxx'
echo $paymentIntent->paymentMethodId;    // 'pm_xxxxx'
echo $paymentIntent->latestPayment->id;   // 'pay_xxxxx'
```

**Returns a [Payment Intent](#payment-intent-resource) resource.**

**Example Response (succeeded):**

```json
{
    "id": "pi_xxxxx",
    "resource": "payment_intent",
    "amount": 10000,
    "amount_received": 10000,
    "amount_capturable": 0,
    "client_secret": "pi_xxxxx_secret_xxxxx",
    "currency": "PHP",
    "description": "",
    "last_payment_error": null,
    "latest_payment": {
        "id": "pay_xxxxx",
        "resource": "payment",
        "amount": 10000,
        "status": "paid"
    },
    "livemode": false,
    "metadata": null,
    "next_action": null,
    "payment_method_options": {
        "card": {
            "capture_type": "automatic"
        }
    },
    "payment_methods": ["card", "gcash"],
    "statement_descriptor": null,
    "status": "succeeded",
    "payment_method_id": "pm_xxxxx",
    "return_url": "https://example.com/payment/return",
    "capture_before_at": null,
    "customer": null,
    "created_at": 1700407880,
    "updated_at": 1700408000
}
```

## Cancel a Payment Intent

Cancel a payment intent. A payment intent can only be canceled when its status is `awaiting_payment_method`.

```php
$paymentIntent = Payrex::paymentIntents()->cancel('pi_xxxxx');

echo $paymentIntent->status; // PaymentIntentStatus::Canceled
```

**Returns a [Payment Intent](#payment-intent-resource) resource.**

**Example Response:**

```json
{
    "id": "pi_xxxxx",
    "resource": "payment_intent",
    "amount": 10000,
    "amount_received": 0,
    "amount_capturable": 0,
    "status": "canceled",
    "latest_payment": null,
    "...": "..."
}
```

## Capture a Payment Intent

For payment intents created with `capture_type: 'manual'` (hold then capture), capture the authorized amount. Check `amountCapturable` to know how much the customer authorized before calling `capture()`.

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | The payment intent ID (`pi_` prefix) |
| `amount` | integer | Yes | The amount to capture, in cents. Must be less than or equal to `amountCapturable`. |

::: code-group

```php [Full Capture]
$paymentIntent = Payrex::paymentIntents()->capture('pi_xxxxx', [
    'amount' => 10000, // Must be ≤ amountCapturable
]);
```

```php [Partial Capture]
$paymentIntent = Payrex::paymentIntents()->capture('pi_xxxxx', [
    'amount' => 5000, // Capture ₱50.00 of the authorized ₱100.00
]);
```

:::

After a successful capture:
- `amount` stays at the original requested amount
- `amount_received` reflects the captured amount
- `amount_capturable` drops to `0` (no further captures allowed)

**Returns a [Payment Intent](#payment-intent-resource) resource.**

**Example Response:**

```json
{
    "id": "pi_xxxxx",
    "resource": "payment_intent",
    "amount": 10000,
    "amount_received": 10000,
    "amount_capturable": 0,
    "status": "succeeded",
    "payment_method_options": {
        "card": {
            "capture_type": "manual"
        }
    },
    "payment_methods": ["card"],
    "payment_method_id": "pm_xxxxx",
    "latest_payment": {
        "id": "pay_xxxxx",
        "resource": "payment",
        "amount": 10000,
        "status": "paid"
    },
    "...": "..."
}
```

## Payment Intent Resource

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (`pi_` prefix) |
| `resource` | string | Always `payment_intent` |
| `amount` | integer | The amount to be collected, in cents. This is the original requested amount — not necessarily the captured amount. |
| `amount_received` | integer | The amount already captured, in cents. For hold-then-capture, check this after calling `capture()` to confirm the captured amount. |
| `amount_capturable` | integer | The authorized amount available to capture, in cents. For hold-then-capture, check this to know how much you can pass to `capture()`. |
| `client_secret` | string | Client secret for frontend use (see [Elements](/guide/elements)) |
| `currency` | string | Three-letter ISO currency code |
| `description` | string | Reference text |
| `status` | string | See [PaymentIntentStatus](/guide/enums#paymentintentstatus) |
| `payment_methods` | array | Allowed payment methods |
| `payment_method_id` | string\|null | Attached payment method ID |
| `payment_method_options` | object\|null | Payment method configuration |
| `statement_descriptor` | string\|null | Bank statement text |
| `customer` | string\|[Customer](/api/customers)\|null | Associated customer (string ID or expanded `Customer` object) |
| `last_payment_error` | object\|null | Failed payment details |
| `latest_payment` | string\|[Payment](/api/payments)\|null | Most recent payment (string ID or expanded `Payment` object) |
| `next_action` | object\|null | Required action (`type`, `redirect_url`) |
| `return_url` | string\|null | Post-authentication redirect URL |
| `capture_before_at` | integer\|null | Capture deadline (Unix timestamp). For hold-then-capture payment intents, the authorized amount must be captured before this time or the authorization will expire and the payment intent will be canceled. |
| `metadata` | object\|null | Key-value pairs |
| `livemode` | boolean | Live or test mode |
| `created_at` | integer | Unix timestamp |
| `updated_at` | integer | Unix timestamp |

::: tip Property Access
Response field names above are shown in `snake_case` (matching the raw API response). In PHP, access them as **camelCase** typed properties on the DTO — e.g., `amount_received` becomes `$paymentIntent->amountReceived`. See [Response Data](/guide/response-data) for details.
:::

## Further Reading

- [Accept a Payment](/guide/accept-a-payment) — Step-by-step payment guide
- [Hold then Capture](/guide/hold-then-capture) — Authorize first, charge later
- [Elements](/guide/elements) — Build a custom payment form with the PayRex JS SDK
- [Webhook Handling](/guide/webhooks) — Handle `payment_intent.succeeded` events
