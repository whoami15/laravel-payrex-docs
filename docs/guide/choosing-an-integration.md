---
title: Choosing an Integration
description: Compare Checkout Sessions and Payment Intents + Elements to decide how to accept payments with PayRex in Laravel.
---

# Choosing an Integration

PayRex offers two ways to accept payments. Both support the same payment methods (cards, GCash, Maya, BillEase, QR Ph, etc.) and both use [webhooks](/guide/webhooks) to notify your app when a payment succeeds or fails. The difference is where the payment UI lives.

::: tip Not sure where to start?
**Start with [Checkout Sessions](/guide/checkout-sessions-guide).** It requires no frontend code, handles the entire payment UI, and gets you accepting payments in minutes. You can always switch to Payment Intents + Elements later when you need more control — the backend concepts (payment intents, webhooks, customers) are the same.
:::

## Checkout Sessions

PayRex hosts the entire payment page. You create a session on the backend, redirect the customer to PayRex, and they come back to your site when done.

```php
$session = Payrex::checkoutSessions()->create([ // [!code focus:8]
    'line_items' => [
        ['name' => 'Pro Plan', 'amount' => 99900, 'quantity' => 1],
    ],
    'payment_methods' => ['card', 'gcash', 'maya'],
    'success_url' => route('checkout.success'),
    'cancel_url' => route('checkout.cancel'),
]);

return redirect()->away($session->url); // [!code focus]
```

**Best for:**
- Getting started quickly
- Landing pages and simple storefronts
- When you don't want to build or maintain a payment form
- When PCI compliance concerns are a priority

See [Checkout Sessions](/guide/checkout-sessions-guide) for the full guide.

## Payment Intents + Elements

You build the payment form in your own app using the PayRex JS SDK. You create a Payment Intent on the backend, pass the `clientSecret` to your frontend, and mount a payment element that collects payment details and sends them directly to PayRex — sensitive card data never touches your server.

**Best for:**
- Fully branded checkout experience
- Single-page applications (Vue, React, etc.)
- Complex checkout flows with multiple steps
- When you want complete control over the UI

See [Elements](/guide/elements) for the full integration guide with Vanilla JS, Vue, and React examples.

## Quick Comparison

| | Checkout Sessions | Payment Intents + Elements |
|---|---|---|
| **Frontend code** | None | PayRex JS SDK |
| **UI customization** | Limited | Full control |
| **Customer stays on your site** | No (redirected to PayRex) | Yes |
| **Implementation effort** | Minimal | Moderate |
| **Hold then capture** | Yes | Yes |
| **Best for** | Simple integrations | Custom checkout flows |

## Which Should I Pick?

**Start with Checkout Sessions** if you want to accept payments as fast as possible. You can always migrate to Payment Intents + Elements later when you need more control — the backend concepts (payment intents, webhooks, customers) are the same.

**Use Payment Intents + Elements** if you already know you need a custom checkout experience or if your app is a single-page application where redirecting away would break the user flow.

::: tip
Both approaches create a Payment Intent under the hood. A Checkout Session is essentially a PayRex-hosted wrapper around a Payment Intent. This means everything you learn about payment intents, webhooks, and error handling applies to both flows.
:::

---

**Next up:** Ready to build? Jump to [Checkout Sessions](/guide/checkout-sessions-guide) (recommended) or [Elements](/guide/elements) for a custom UI.

## Further Reading

- [Checkout Sessions](/guide/checkout-sessions-guide) — Full guide for the hosted payment page
- [Elements](/guide/elements) — Full guide for the custom payment form
- [Accept a Payment](/guide/accept-a-payment) — Step-by-step payment guide
- [Payment Methods](/guide/payment-methods) — All supported payment methods
