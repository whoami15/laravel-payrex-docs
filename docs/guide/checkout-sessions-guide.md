---
title: Checkout Sessions
description: Accept payments using a PayRex-hosted checkout page in your Laravel application.
---

# Checkout Sessions

Checkout Sessions let you accept payments using a PayRex-hosted payment page. Instead of building a payment form, you create a session on the backend and redirect the customer to PayRex. They complete payment there and are redirected back to your site.

::: tip When to use Checkout Sessions vs. Elements
- **Checkout Sessions** — No frontend code. PayRex hosts the entire payment UI. Best for getting started quickly.
- **Elements** — Embed payment fields directly in your app. Full control over the UI. Best for a branded checkout experience.

See [Choosing an Integration](/guide/choosing-an-integration) for a detailed comparison.
:::

## How It Works

```
1. You create a Checkout Session with line items and payment methods
2. You redirect the customer to the session URL
3. Customer completes payment on the PayRex-hosted page
4. Customer is redirected to your success_url or cancel_url
5. PayRex sends a payment_intent.succeeded webhook to your server
6. You fulfill the order
```

## Step 1: Create a Checkout Session

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$session = Payrex::checkoutSessions()->create([ // [!code focus:8]
    'line_items' => [
        ['name' => 'Premium Plan', 'amount' => 99900, 'quantity' => 1],
    ],
    'payment_methods' => ['card', 'gcash', 'maya'],
    'success_url' => route('checkout.success'),
    'cancel_url' => route('checkout.cancel'),
]);

return redirect()->away($session->url); // [!code focus]
```

The `success_url` and `cancel_url` are where the customer is redirected after payment. See [Step 3](#step-3-handle-the-redirect) for how to handle them.

### Line Items

Each line item represents a product or service the customer is purchasing:

```php
'line_items' => [
    [
        'name' => 'Premium Plan',           // Required
        'amount' => 99900,                  // Required. Price per unit in cents (₱999.00)
        'quantity' => 1,                    // Required
        'description' => '12-month access', // Optional
        'image' => 'https://...',           // Optional. Product image URL
    ],
],
```

### Options

You can customize the checkout experience with additional parameters:

```php
$session = Payrex::checkoutSessions()->create([
    'line_items' => [
        ['name' => 'Premium Plan', 'amount' => 99900, 'quantity' => 1],
    ],
    'payment_methods' => ['card', 'gcash', 'maya'],
    'success_url' => route('checkout.success'),
    'cancel_url' => route('checkout.cancel'),
    'description' => 'Subscription payment',
    'billing_details_collection' => 'always',       // Collect billing details // [!code focus]
    'submit_type' => 'donate',                        // Button label: 'pay' (default) or 'donate' // [!code focus]
    'statement_descriptor' => 'MYSTORE',             // Bank statement text // [!code focus]
    'metadata' => [
        'cart_id' => (string) $cart->id,
    ],
]);
```

See [Checkout Sessions API](/api/checkout-sessions) for all available parameters.

## Step 2: Customer Completes Payment

After you redirect the customer to `$session->url`, they see the PayRex-hosted checkout page with the line items and payment method options you specified. They select a payment method, enter their details, and complete payment.

PayRex handles everything on this page — card forms, 3D Secure, e-wallet redirects, QR codes. No frontend code is needed from your side.

## Step 3: Handle the Redirect

After payment, the customer is redirected to your `success_url` or `cancel_url`. Use this to show a confirmation or cancellation message:

```php
// routes/web.php
Route::get('/checkout/success', function () {
    return view('checkout.success');
})->name('checkout.success');

Route::get('/checkout/cancel', function () {
    return view('checkout.cancel');
})->name('checkout.cancel');
```

::: warning Don't rely on the redirect for fulfillment
The `success_url` redirect is a **UX mechanism** — it shows the customer a confirmation message. The customer might close their browser before the redirect happens. Always use [webhooks](/guide/webhooks) to fulfill orders.
:::

## Step 4: Confirm Payment via Webhook

Listen for the `payment_intent.succeeded` webhook event to fulfill the order. This works the same way regardless of whether you used a Checkout Session or Payment Intent + Elements.

Make sure webhooks are enabled in your `.env`:

```ini
PAYREX_WEBHOOK_ENABLED=true
PAYREX_WEBHOOK_SECRET=your_webhook_secret
```

Then add a listener:

```php
use Illuminate\Support\Facades\Event;
use LegionHQ\LaravelPayrex\Events\PaymentIntentSucceeded;

// In AppServiceProvider::boot()
Event::listen(PaymentIntentSucceeded::class, function (PaymentIntentSucceeded $event) { // [!code focus:8]
    /** @var PaymentIntent $paymentIntent */
    $paymentIntent = $event->data();

    Order::query()
        ->where('payment_intent_id', $paymentIntent->id)
        ->update(['status' => 'paid']);
});
```

See [Webhook Handling](/guide/webhooks) for the full guide.

## Expiring a Session

Checkout sessions expire automatically after **24 hours**. You can expire a session manually to prevent further use:

```php
$session = Payrex::checkoutSessions()->expire('cs_xxxxx');
```

You can also set a custom expiration when creating the session:

```php
$session = Payrex::checkoutSessions()->create([
    'line_items' => [...],
    'payment_methods' => ['card', 'gcash'],
    'success_url' => route('checkout.success'),
    'cancel_url' => route('checkout.cancel'),
    'expires_at' => now()->addHour()->timestamp, // Expire in 1 hour // [!code focus]
]);
```

Listen for the `checkout_session.expired` event if you need to handle expired sessions:

```php
use LegionHQ\LaravelPayrex\Events\CheckoutSessionExpired;

Event::listen(CheckoutSessionExpired::class, function (CheckoutSessionExpired $event) {
    // Release reserved inventory, notify the customer, etc.
});
```

## Hold then Capture

Checkout Sessions support [Hold then Capture](/guide/hold-then-capture) for card payments. Pass `payment_method_options` to authorize without charging:

```php
$session = Payrex::checkoutSessions()->create([
    'line_items' => [
        ['name' => 'Hotel Booking', 'amount' => 50000, 'quantity' => 1],
    ],
    'payment_methods' => ['card'],
    'payment_method_options' => [ // [!code focus:3]
        'card' => ['capture_type' => 'manual'],
    ],
    'success_url' => route('checkout.success'),
    'cancel_url' => route('checkout.cancel'),
]);
```

See [Hold then Capture](/guide/hold-then-capture) for the full capture flow.

---

**Next up:** [Webhook Handling](/guide/webhooks) — set up event listeners so your app knows when payments succeed, fail, or change state.

## Further Reading

- [Checkout Sessions API](/api/checkout-sessions) — Full parameter and response reference
- [Choosing an Integration](/guide/choosing-an-integration) — Compare Checkout Sessions vs. Elements
- [Webhook Handling](/guide/webhooks) — Set up event listeners for payment notifications
- [Payment Methods](/guide/payment-methods) — All supported payment methods
