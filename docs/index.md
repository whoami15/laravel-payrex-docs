---
title: PayRex for Laravel - Accept Payments in the Philippines
description: An unofficial Laravel package for integrating PayRex payment platform - cards, GCash, Maya, BillEase, QR Ph, and more.
layout: home

hero:
  name: PayRex for Laravel
  text: Accept Payments in the Philippines
  tagline: Cards, GCash, Maya, BillEase, QR Ph, BDO Installment - integrated into your Laravel app in minutes.
  image:
    src: /hero.svg
    alt: PayRex for Laravel
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: API Reference
      link: /api/payment-intents
    - theme: alt
      text: GitHub
      link: https://github.com/whoami15/payrex-laravel

features:
  - title: Multiple Payment Methods
    details: Accept credit and debit card payments, GCash, Maya, BillEase, QR Ph, and BDO Installment - all through a single, unified API.
  - title: Secure Webhooks
    details: HMAC-SHA256 signature verification with timing-safe comparison and replay attack protection. Typed Laravel event classes for every PayRex event.
  - title: Billing Statements
    details: Create one-time payment links with line items, finalize for payment, send via email, and track lifecycle - draft, open, paid, void, or uncollectible.
  - title: Customer Management
    details: Link your User model to PayRex customers with a Billable trait. Create, retrieve, update, and delete customers directly from your Eloquent models.
---

<style>
.code-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

.code-demo h2 {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.code-demo p.subtitle {
  text-align: center;
  color: var(--vp-c-text-2);
  margin-bottom: 2rem;
}

.quick-links {
  max-width: 800px;
  margin: 2rem auto 0;
  padding: 0 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.quick-links a {
  display: block;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: border-color 0.25s;
}

.quick-links a:hover {
  border-color: var(--vp-c-brand-1);
}

.quick-links a .title {
  font-weight: 600;
  margin-bottom: 4px;
}

.quick-links a .desc {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
</style>

<div class="code-demo">

## Quick Look

<p class="subtitle">See how simple it is to accept payments with PayRex for Laravel.</p>

There are two main ways to accept payments: **Checkout Sessions** for a hosted payment page, or **Payment Intents** with [PayRex Elements](/guide/elements) for a custom payment UI.

### Hosted Checkout

```php
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

### Payment Intent (Custom UI)

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

// Create a Payment Intent on the backend
$paymentIntent = Payrex::paymentIntents()->create([
    'amount' => 10000, // ₱100.00 in cents
    'payment_methods' => ['card', 'gcash', 'maya'],
]);

// Pass the client secret to your frontend for PayRex Elements
return response()->json([
    'client_secret' => $paymentIntent->clientSecret,
]);
```

### Handle Webhooks

::: code-group

```php [Event Listener]
use Illuminate\Support\Facades\Event;
use LegionHQ\LaravelPayrex\Events\PaymentIntentSucceeded;

Event::listen(PaymentIntentSucceeded::class, function (PaymentIntentSucceeded $event) {
    /** @var PaymentIntent $paymentIntent */
    $paymentIntent = $event->data();

    Order::query()
        ->where('payment_intent_id', $paymentIntent->id)
        ->update(['status' => 'paid']);
});
```

```php [Custom Handling]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$event = Payrex::constructEvent(
    $request->getContent(),
    $request->header('Payrex-Signature'),
);

$type = $event->eventType();    // WebhookEventType::PaymentIntentSucceeded

/** @var PaymentIntent $paymentIntent */
$paymentIntent = $event->data();
```

:::

</div>

<div class="quick-links">
  <a href="/guide/getting-started">
    <div class="title">Installation</div>
    <div class="desc">Install via Composer, add your API keys, done.</div>
  </a>
  <a href="/api/payment-intents">
    <div class="title">API Reference</div>
    <div class="desc">Every resource, method, and response field.</div>
  </a>
  <a href="/guide/webhooks">
    <div class="title">Webhooks</div>
    <div class="desc">Handle payment events with typed Laravel event classes.</div>
  </a>
</div>
