---
title: Getting Started
description: Install and configure the Laravel PayRex package to accept GCash, Maya, cards, and more in your Laravel app.
---

# Getting Started

## Requirements

- PHP 8.2+
- Laravel 11+
- A [PayRex account](https://dashboard.payrexhq.com/signup) with API keys

## Installation

Install the package via Composer:

```bash
composer require legionhq/laravel-payrex
```

Publish the config file:

```bash
php artisan vendor:publish --tag="payrex-config"
```

This creates `config/payrex.php` where you can customize API keys, timeouts, retry behavior, and webhook settings.

**Optional:** If you plan to link your User model to PayRex customers using the [Billable Customer](/guide/billable-customer) trait, also publish and run the migration:

```bash
php artisan vendor:publish --tag="payrex-migrations"
php artisan migrate
```

## Environment Variables

Add your API keys to your `.env` file:

```ini
PAYREX_PUBLIC_KEY=your_public_key
PAYREX_SECRET_KEY=your_secret_key
PAYREX_WEBHOOK_ENABLED=true
PAYREX_WEBHOOK_SECRET=your_webhook_secret
```

You can find your API keys in the [PayRex Dashboard](https://dashboard.payrexhq.com/t/developers/api-keys) under **Developers > API Keys**.

::: tip Test vs. Live Keys
Use your **test mode** keys during development and **live mode** keys in production. Test keys are prefixed with `sk_test_` and `pk_test_`, while live keys use `sk_live_` and `pk_live_`.
:::

## Quick Start

### Using the Facade

The `Payrex` facade provides static access to all API resources. The simplest way to accept a payment is with a [Checkout Session](/guide/checkout-sessions-guide) — PayRex hosts the entire payment page, no frontend code needed:

::: code-group

```php [Basic]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$session = Payrex::checkoutSessions()->create([
    'line_items' => [
        ['name' => 'Pro Plan', 'amount' => 99900, 'quantity' => 1],
    ],
    'payment_methods' => ['card', 'gcash', 'maya'],
    'success_url' => route('checkout.success'),
    'cancel_url' => route('checkout.cancel'),
]);

return redirect()->away($session->url);
```

```php [With Metadata]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$session = Payrex::checkoutSessions()->create([ // [!code focus]
    'line_items' => [
        ['name' => 'Pro Plan', 'amount' => 99900, 'quantity' => 1],
    ],
    'payment_methods' => ['card', 'gcash', 'maya'],
    'success_url' => route('checkout.success'),
    'cancel_url' => route('checkout.cancel'),
    'metadata' => [ // [!code focus:3]
        'order_id' => (string) $order->id,
    ],
]); // [!code focus]

return redirect()->away($session->url); // [!code focus]
```

:::

::: info Amounts are in Cents
All monetary amounts in the PayRex API are expressed in **cents** (the smallest currency unit). For example, ₱999.00 is `99900` cents. The package does not perform any currency conversion.
:::

::: tip Using Billable Customer?
If you've set up the [Billable Customer](/guide/billable-customer) trait, you can associate the checkout session with a PayRex customer:
```php
'customer_id' => $request->user()->payrexCustomerId(),
```
:::

::: tip Need a custom payment UI?
Use [Payment Intents + Elements](/guide/elements) instead of Checkout Sessions to build a fully branded checkout experience. See [Choosing an Integration](/guide/choosing-an-integration) to compare the two approaches.
:::

### Using Dependency Injection

You can also inject `PayrexClient` instead of using the facade:

```php
use LegionHQ\LaravelPayrex\PayrexClient;

class CheckoutController extends Controller
{
    public function store(Request $request, PayrexClient $client) // [!code focus:13]
    {
        $session = $client->checkoutSessions()->create([
            'line_items' => [
                ['name' => 'Pro Plan', 'amount' => 99900, 'quantity' => 1],
            ],
            'payment_methods' => ['card', 'gcash', 'maya'],
            'success_url' => route('checkout.success'),
            'cancel_url' => route('checkout.cancel'),
        ]);

        return redirect()->away($session->url);
    }
}
```

::: tip
The `Payrex` facade and injected `PayrexClient` resolve the same singleton — use whichever you prefer. You can also resolve it via `app(PayrexClient::class)`.
:::

### Handling Webhook Events

Enable webhooks to get notified when payments succeed, fail, or change state:

```ini
PAYREX_WEBHOOK_ENABLED=true
PAYREX_WEBHOOK_SECRET=your_webhook_secret
```

```php
use Illuminate\Support\Facades\Event;
use LegionHQ\LaravelPayrex\Events\PaymentIntentSucceeded;

// In AppServiceProvider::boot()
Event::listen(PaymentIntentSucceeded::class, function (PaymentIntentSucceeded $event) {
    /** @var PaymentIntent $paymentIntent */
    $paymentIntent = $event->data();

    Order::query()
        ->where('payment_intent_id', $paymentIntent->id)
        ->update(['status' => 'paid']);
});
```

See [Webhook Handling](/guide/webhooks) for full details on signature verification, event classes, and `constructEvent()`.

## Available Resources

| Resource | Accessor | Operations |
|---|---|---|
| [Payment Intents](/api/payment-intents) | `paymentIntents` | create, retrieve, cancel, capture |
| [Payments](/api/payments) | `payments` | retrieve, update |
| [Checkout Sessions](/api/checkout-sessions) | `checkoutSessions` | create, retrieve, expire |
| [Refunds](/api/refunds) | `refunds` | create, update |
| [Customers](/api/customers) | `customers` | create, list, retrieve, update, delete |
| [Billing Statements](/api/billing-statements) | `billingStatements` | create, list, retrieve, update, delete, finalize, void, markUncollectible, send |
| [Billing Statement Line Items](/api/billing-statement-line-items) | `billingStatementLineItems` | create, update, delete |
| [Payout Transactions](/api/payout-transactions) | `payoutTransactions` | list (by payout ID) |
| [Webhooks](/api/webhooks-resource) | `webhooks` | create, list, retrieve, update, delete, enable, disable |

## Next Steps

**Next up:** [Configuration](/guide/configuration) — set up timeouts, retries, webhook path, and more.

- [Choosing an Integration](/guide/choosing-an-integration) — Compare Checkout Sessions vs. Payment Intents + Elements
- [Billable Customer](/guide/billable-customer) — Link your User model to PayRex customers
- [Response Data](/guide/response-data) — Typed properties, array access, and response metadata
- [Webhook Handling](/guide/webhooks) — Set up event listeners for payment notifications
- [Elements](/guide/elements) — Use PayRex JS SDK on the client side
- [Error Handling](/guide/error-handling) — Handle API errors gracefully
- [API Reference](/api/payment-intents) — Detailed documentation for every resource
