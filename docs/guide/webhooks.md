---
title: Webhook Handling
description: Handle PayRex webhook events with HMAC-SHA256 signature verification and typed Laravel event classes.
---

# Webhook Handling

The package provides a built-in webhook endpoint that verifies incoming webhook signatures using HMAC-SHA256. The route is disabled by default — enable it by setting `PAYREX_WEBHOOK_ENABLED=true` in your `.env` (see [Configuration](/guide/configuration#enabling-the-webhook-route)). There are two ways to handle webhook events — event listeners for most use cases, and `constructEvent()` for advanced scenarios.

See [Configuration](/guide/configuration#webhook-configuration) for setting up your webhook URL, secret, and other options.

::: tip Quick Start
Most apps only need four steps:
1. Set `PAYREX_WEBHOOK_ENABLED=true` in your `.env` file.
2. Set `PAYREX_WEBHOOK_SECRET` in your `.env` file.
3. Add an event listener in `AppServiceProvider::boot()`:
   ```php
   Event::listen(PaymentIntentSucceeded::class, function (PaymentIntentSucceeded $event) {
       // Fulfill the order...
   });
   ```
4. Done — the package registers the webhook route and verifies signatures for you.
:::

## How It Works

1. PayRex sends a POST request to your webhook endpoint with a `Payrex-Signature` header.
2. The `VerifyWebhookSignature` middleware validates the signature and timestamp.
3. A generic `WebhookReceived` event is dispatched for every webhook.
4. A specific typed event class is dispatched based on the event type (e.g., `PaymentIntentSucceeded`).
5. Your application returns a `200` response to acknowledge receipt.

## Signature Verification

The package includes a `VerifyWebhookSignature` middleware that is automatically applied to the webhook route. It verifies every incoming request before your listeners are called.

Every webhook request from PayRex includes a `Payrex-Signature` header:

```
t={timestamp},te={test_signature},li={live_signature}
```

The middleware verifies the HMAC-SHA256 signature using timing-safe comparison (`hash_equals()`) and rejects requests with missing or malformed headers, invalid signatures, or expired timestamps (default: 300 seconds).

### Error Responses

When verification fails, the middleware throws an `AccessDeniedHttpException` (403):

| Scenario | Error Message |
|---|---|
| Missing `Payrex-Signature` header | `Missing Payrex-Signature header.` |
| Malformed `Payrex-Signature` header | `Unable to parse Payrex-Signature header.` |
| Invalid or tampered signature | `Webhook signature does not match the expected signature.` |
| Expired timestamp (beyond tolerance) | `Webhook timestamp is outside the tolerance zone.` |
| Webhook secret not configured | `Webhook secret is not configured.` |

## Event Listeners {#event-listeners}

The default and recommended approach. The built-in controller dispatches Laravel events that you listen to in your application.

### Specific Event Classes

Listen to individual event types for targeted handling:

```php
use Illuminate\Support\Facades\Event;
use LegionHQ\LaravelPayrex\Events\PaymentIntentSucceeded;
use LegionHQ\LaravelPayrex\Events\RefundCreated;

// In AppServiceProvider::boot()
Event::listen(PaymentIntentSucceeded::class, function (PaymentIntentSucceeded $event) { // [!code focus:7]
    /** @var PaymentIntent $paymentIntent */
    $paymentIntent = $event->data();
    $amount = $paymentIntent->amount;

    // Fulfill the order...
});

Event::listen(RefundCreated::class, function (RefundCreated $event) { // [!code focus:6]
    /** @var Refund $refund */
    $refund = $event->data();

    // Process the refund...
});
```

### Catch-All Event

Listen to all incoming webhooks with a single handler:

```php
use Illuminate\Support\Facades\Event;
use LegionHQ\LaravelPayrex\Events\WebhookReceived;

Event::listen(WebhookReceived::class, function (WebhookReceived $event) { // [!code focus:7]
    $type = $event->eventType();  // e.g., WebhookEventType::PaymentIntentSucceeded
    $data = $event->data();       // Typed DTO (PaymentIntent, Refund, etc.)
    $isLive = $event->isLiveMode();

    Log::info('Webhook received', ['type' => $type?->value, 'id' => $data->id]);
});
```

::: info
`WebhookReceived` is dispatched for **every** webhook, in addition to the type-specific event. This is useful for logging, metrics, or handling event types that don't have a dedicated class.
:::

### Using Listener Classes

For more complex logic, create dedicated listener classes:

```php
namespace App\Listeners;

use LegionHQ\LaravelPayrex\Events\PaymentIntentSucceeded;

class FulfillOrder
{
    public function handle(PaymentIntentSucceeded $event): void // [!code focus:11]
    {
        /** @var PaymentIntent $paymentIntent */
        $paymentIntent = $event->data();

        Order::query()
            ->where('payment_intent_id', $paymentIntent->id)
            ->update(['status' => 'paid']);

        // Send confirmation email, update inventory, etc.
    }
}
```

Register the listener in your `AppServiceProvider::boot()` method:

```php
use Illuminate\Support\Facades\Event;
use LegionHQ\LaravelPayrex\Events\PaymentIntentSucceeded;
use App\Listeners\FulfillOrder;

// In AppServiceProvider::boot()
Event::listen(PaymentIntentSucceeded::class, FulfillOrder::class);
```

### Queueing Listeners

For long-running operations, implement `ShouldQueue` to process webhooks asynchronously:

```php
namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use LegionHQ\LaravelPayrex\Events\PaymentIntentSucceeded;

class FulfillOrder implements ShouldQueue // [!code focus]
{
    public function handle(PaymentIntentSucceeded $event): void // [!code focus:10]
    {
        // This runs in the background via your queue worker
        /** @var PaymentIntent $paymentIntent */
        $paymentIntent = $event->data();

        Order::query()
            ->where('payment_intent_id', $paymentIntent->id)
            ->update(['status' => 'paid']);
    }
}
```

::: warning
When using queued listeners, your webhook endpoint returns `200` immediately. If the queued job fails, PayRex won't know about it. Implement proper error handling and dead letter queues for critical payment flows.
:::

## Custom Webhook Handling with `constructEvent` {#construct-event}

For advanced use cases where you need full control over the webhook handling flow — such as custom routes, multi-tenant setups with different webhook secrets, or custom processing logic — use `Payrex::constructEvent()`. Signature verification is still handled for you under the hood.

```php
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use LegionHQ\LaravelPayrex\Data\PayrexObject;
use LegionHQ\LaravelPayrex\Enums\WebhookEventType;
use LegionHQ\LaravelPayrex\Exceptions\WebhookVerificationException;
use LegionHQ\LaravelPayrex\Facades\Payrex;

class CustomWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        try {
            $event = Payrex::constructEvent( // [!code focus:6]
                payload: $request->getContent(),
                signatureHeader: $request->header('Payrex-Signature'),
                // secret defaults to your configured PAYREX_WEBHOOK_SECRET
                // tolerance defaults to 300 seconds
            );
        } catch (WebhookVerificationException $e) {
            return response('Invalid signature', 403);
        }

        // $event is a typed PayrexEvent instance (e.g., PaymentIntentSucceeded)
        $type = $event->eventType();    // WebhookEventType::PaymentIntentSucceeded
        $data = $event->data();         // Typed DTO (PaymentIntent, Refund, etc.)
        $isLive = $event->isLiveMode(); // true/false

        match ($type) { // [!code focus:5]
            WebhookEventType::PaymentIntentSucceeded => $this->fulfill($data),
            WebhookEventType::RefundCreated => $this->processRefund($data),
            default => null,
        };

        return response('OK', 200);
    }

    private function fulfill(PayrexObject $data): void
    {
        // Update order status, send confirmation, etc.
    }

    private function processRefund(PayrexObject $data): void
    {
        // Handle refund logic
    }
}
```

### Multi-Tenant Example

```php
use LegionHQ\LaravelPayrex\Exceptions\WebhookVerificationException;
use LegionHQ\LaravelPayrex\Facades\Payrex;

Route::post('webhooks/payrex/{tenant}', function (Request $request, string $tenant) {
    $tenantSecret = Tenant::find($tenant)->payrex_webhook_secret; // [!code focus]

    try {
        $event = Payrex::constructEvent( // [!code focus:5]
            payload: $request->getContent(),
            signatureHeader: $request->header('Payrex-Signature'),
            secret: $tenantSecret,
        );
    } catch (WebhookVerificationException $e) {
        return response('Invalid signature', 403);
    }

    // Handle event for this tenant...
    return response('OK', 200);
});
```

::: info
When using `constructEvent()`, signature verification is handled by the method itself — you don't need the `VerifyWebhookSignature` middleware. The method throws `WebhookVerificationException` on failure.
:::

## Retry Behavior

PayRex attempts event delivery for up to **3 days** with **exponential backoff**. If your endpoint returns a non-2xx response, PayRex will retry the delivery automatically.

- Disabled or deleted webhook endpoints halt future retries.
- Re-enabling a webhook endpoint resumes delivery of pending events.

::: tip Design your webhook handlers to be idempotent
Your handlers should produce the same result even if the same event is delivered more than once. Use the event `id` to deduplicate:

```php
Event::listen(PaymentIntentSucceeded::class, function (PaymentIntentSucceeded $event) {
    $eventId = $event->payload['id']; // 'evt_xxxxx'

    try {
        DB::transaction(function () use ($eventId, $event) {
            DB::table('processed_webhook_events')->insert([
                'event_id' => $eventId,
                'processed_at' => now(),
            ]);

            /** @var PaymentIntent $paymentIntent */
            $paymentIntent = $event->data();
            
            Order::query()
                ->where('payment_intent_id', $paymentIntent->id)
                ->update(['status' => 'paid']);
        });
    } catch (UniqueConstraintViolationException) {
        return;
    }
});
```

This prevents duplicate order fulfillment, double emails, or repeated inventory changes when PayRex retries a delivery.
:::

## Which Approach Should I Use?

| Approach | Best For |
|---|---|
| [Event Listeners](#event-listeners) | Most applications. Clean separation of concerns, works with Laravel's event system, supports queuing. Uses the package's built-in controller and middleware. |
| [Custom route with built-in controller](/guide/configuration#enabling-the-webhook-route) | When you need a different URL path or extra middleware, but still want automatic event dispatching. |
| [`constructEvent()`](#construct-event) | Full control — multi-tenant apps with per-tenant secrets, custom response logic, or handling webhooks outside the built-in controller. |

## Event Helper Methods

All event classes extend `PayrexEvent` and provide these methods:

| Method | Return Type | Description |
|---|---|---|
| `$event->data()` | `PayrexObject` | The affected resource as a typed DTO (e.g., `PaymentIntent`, `Refund`) with enum casting |
| `$event->eventType()` | `WebhookEventType\|null` | The event type as an enum (e.g., `WebhookEventType::PaymentIntentSucceeded`) |
| `$event->isLiveMode()` | `bool` | Whether the event occurred in live mode (`true` for production, `false` for test webhooks) |
| `$event->payload` | `array` | The full raw webhook payload |

### Payload Structure

The raw payload has this structure:

```php
[
    'id' => 'evt_xxxxx',
    'resource' => 'event',
    'type' => 'payment_intent.succeeded',
    'livemode' => true,
    'pending_webhooks' => 0,
    'data' => [
        'id' => 'pi_xxxxx',
        'resource' => 'payment_intent',
        'amount' => 10000,
        // ... all fields of the affected resource
    ],
    'previous_attributes' => [
        // Present on update events — contains the previous values of changed fields
        'status' => 'awaiting_payment_method',
    ],
    'created_at' => 1709251200,
    'updated_at' => 1709251200,
]
```

`$event->data()` returns the `data` object — the actual payment intent, refund, payout, etc.

::: info previous_attributes
The `previous_attributes` field is included in update events (e.g., `billing_statement.updated`, `refund.updated`) and contains the previous values of fields that changed. Access it via the raw payload: `$event->payload['previous_attributes']`.
:::

::: warning Malformed Payloads
`$event->data()` throws an `InvalidArgumentException` if the `data` key is missing, empty, or not an array. If you're using `constructEvent()` in a custom controller, wrap the `data()` call in a try-catch if you want to handle this gracefully.
:::

::: tip
Use `$event->isLiveMode()` to tell test webhooks apart from production ones — e.g., skip fulfillment logic during testing or route events to different handlers.
:::

## Available Event Classes

All classes are in the `LegionHQ\LaravelPayrex\Events` namespace.

### Payment Events

| PayRex Event | Laravel Event Class |
|---|---|
| `payment_intent.succeeded` | `PaymentIntentSucceeded` |
| `payment_intent.amount_capturable` | `PaymentIntentAmountCapturable` |

### Cash Balance Events

| PayRex Event | Laravel Event Class |
|---|---|
| `cash_balance.funds_available` | `CashBalanceFundsAvailable` |


### Checkout Events

| PayRex Event | Laravel Event Class |
|---|---|
| `checkout_session.expired` | `CheckoutSessionExpired` |

### Payout Events

| PayRex Event | Laravel Event Class |
|---|---|
| `payout.deposited` | `PayoutDeposited` |

### Refund Events

| PayRex Event | Laravel Event Class |
|---|---|
| `refund.created` | `RefundCreated` |
| `refund.updated` | `RefundUpdated` |

### Billing Statement Events

| PayRex Event | Laravel Event Class |
|---|---|
| `billing_statement.created` | `BillingStatementCreated` |
| `billing_statement.updated` | `BillingStatementUpdated` |
| `billing_statement.deleted` | `BillingStatementDeleted` |
| `billing_statement.finalized` | `BillingStatementFinalized` |
| `billing_statement.sent` | `BillingStatementSent` |
| `billing_statement.marked_uncollectible` | `BillingStatementMarkedUncollectible` |
| `billing_statement.voided` | `BillingStatementVoided` |
| `billing_statement.paid` | `BillingStatementPaid` |
| `billing_statement.will_be_due` | `BillingStatementWillBeDue` — sent **5 days** before the due date |
| `billing_statement.overdue` | `BillingStatementOverdue` — sent **5 days** after the due date |

### Billing Statement Line Item Events

| PayRex Event | Laravel Event Class |
|---|---|
| `billing_statement_line_item.created` | `BillingStatementLineItemCreated` |
| `billing_statement_line_item.updated` | `BillingStatementLineItemUpdated` |
| `billing_statement_line_item.deleted` | `BillingStatementLineItemDeleted` |

## Sample Webhook Payloads {#sample-payloads}

Below are actual webhook payloads sent by PayRex in test mode. Use these as a reference for the data structure available via `$event->payload`.

### Payment Intent Events

::: code-group

```json [payment_intent.succeeded]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "payment_intent.succeeded",
    "data": {
        "id": "pi_xxxxx",
        "resource": "payment_intent",
        "amount": 10000,
        "amount_received": 10000,
        "amount_capturable": 0,
        "client_secret": "pi_xxxxx_secret_xxxxx",
        "currency": "PHP",
        "description": null,
        "last_payment_error": null,
        "latest_payment": {
            "id": "pay_xxxxx",
            "resource": "payment",
            "amount": 10000,
            "amount_refunded": 0,
            "billing": {
                "name": "test",
                "email": "test@gmail.com",
                "phone": "09090909091",
                "address": {
                    "line1": "test",
                    "line2": null,
                    "city": "test",
                    "state": "test",
                    "postal_code": "1234",
                    "country": "PH"
                }
            },
            "currency": "PHP",
            "description": null,
            "fee": 0,
            "livemode": false,
            "metadata": null,
            "net_amount": 10000,
            "payment_intent_id": "pi_xxxxx",
            "payment_method": {
                "type": "card",
                "card": {
                    "first6": "424242",
                    "last4": "4242",
                    "approval_code": "test",
                    "brand": "visa"
                }
            },
            "refunded": false,
            "status": "paid",
            "created_at": 1773748943,
            "updated_at": 1773748943
        },
        "livemode": false,
        "metadata": null,
        "payment_methods": ["card", "gcash", "maya", "qrph"],
        "payment_method_id": "pm_xxxxx",
        "payment_method_options": {
            "card": {
                "capture_type": "automatic",
                "request_three_d_secure": "any"
            }
        },
        "statement_descriptor": null,
        "status": "succeeded",
        "next_action": null,
        "return_url": "https://checkout.payrexhq.com/c/cs_xxxxx_secret_xxxxx",
        "created_at": 1773748911,
        "updated_at": 1773748943
    },
    "livemode": false,
    "pending_webhooks": 0,
    "previous_attributes": {
        "status": "processing",
        "amount_capturable": 0,
        "amount_received": 0
    },
    "created_at": 1773748943,
    "updated_at": 1773748961
}
```

```json [payment_intent.amount_capturable]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "payment_intent.amount_capturable",
    "data": {
        "id": "pi_xxxxx",
        "resource": "payment_intent",
        "amount": 10000,
        "amount_received": 0,
        "amount_capturable": 10000,
        "capture_before_at": 1774405483,
        "client_secret": "pi_xxxxx_secret_xxxxx",
        "currency": "PHP",
        "description": null,
        "last_payment_error": null,
        "latest_payment": null,
        "livemode": false,
        "metadata": null,
        "payment_methods": ["card"],
        "payment_method_id": "pm_xxxxx",
        "payment_method_options": {
            "card": {
                "request_three_d_secure": "any",
                "capture_type": "manual"
            }
        },
        "statement_descriptor": null,
        "status": "awaiting_capture",
        "next_action": null,
        "return_url": "https://checkout.payrexhq.com/c/cs_xxxxx_secret_xxxxx",
        "created_at": 1773800651,
        "updated_at": 1773800683
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {
        "status": "processing",
        "amount_capturable": 0
    },
    "created_at": 1773800683,
    "updated_at": 1773800683
}
```

:::

### Refund Events

::: code-group

```json [refund.created]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "refund.created",
    "data": {
        "id": "re_xxxxx",
        "resource": "refund",
        "amount": 10000,
        "currency": "PHP",
        "livemode": false,
        "status": "succeeded",
        "description": null,
        "reason": "requested_by_customer",
        "remarks": null,
        "payment_id": "pay_xxxxx",
        "metadata": null,
        "created_at": 1773749372,
        "updated_at": 1773749372
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {},
    "created_at": 1773749372,
    "updated_at": 1773749372
}
```

```json [refund.updated]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "refund.updated",
    "data": {
        "id": "re_xxxxx",
        "resource": "refund",
        "amount": 10000,
        "currency": "PHP",
        "livemode": false,
        "status": "succeeded",
        "description": null,
        "reason": "requested_by_customer",
        "remarks": null,
        "payment_id": "pay_xxxxx",
        "metadata": {
            "reason_detail": "customer requested"
        },
        "created_at": 1773749372,
        "updated_at": 1773792012
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {},
    "created_at": 1773809516,
    "updated_at": 1773809516
}
```

:::

### Checkout Session Events

::: code-group

```json [checkout_session.expired]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "checkout_session.expired",
    "data": {
        "id": "cs_xxxxx",
        "resource": "checkout_session",
        "customer_reference_id": null,
        "client_secret": "cs_xxxxx_secret_xxxxx",
        "status": "expired",
        "currency": "PHP",
        "line_items": [
            {
                "id": "cs_li_xxxxx",
                "resource": "checkout_session_line_item",
                "name": "Wireless Bluetooth Headphones",
                "amount": 10000,
                "quantity": 1,
                "description": null,
                "image": null
            }
        ],
        "livemode": false,
        "url": "https://checkout.payrexhq.com/c/cs_xxxxx_secret_xxxxx",
        "payment_intent": {
            "id": "pi_xxxxx",
            "resource": "payment_intent",
            "amount": 10000,
            "amount_received": 0,
            "amount_capturable": 0,
            "currency": "PHP",
            "status": "canceled",
            "livemode": false
        },
        "metadata": null,
        "success_url": "https://example.com/checkout/success",
        "cancel_url": "https://example.com/checkout/cancel",
        "payment_methods": ["card", "maya", "gcash", "qrph"],
        "capture_type": "automatic",
        "description": null,
        "submit_type": "pay",
        "expires_at": 1773836092,
        "created_at": 1773749692,
        "updated_at": 1773749767
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {
        "status": "active"
    },
    "created_at": 1773749767,
    "updated_at": 1773749767
}
```

:::

### Billing Statement Events

::: code-group

```json [billing_statement.created]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "billing_statement.created",
    "data": {
        "id": "bstm_xxxxx",
        "resource": "billing_statement",
        "amount": 0,
        "currency": "PHP",
        "customer_id": "cus_xxxxx",
        "description": "March 2026 Invoice",
        "due_at": 0,
        "finalized_at": 0,
        "billing_statement_merchant_name": null,
        "billing_statement_number": "UAEONUMZ-0001",
        "billing_statement_url": "https://bill.payrexhq.com/b/test_bstm_xxxxx_secret_xxxxx",
        "line_items": [],
        "livemode": false,
        "statement_descriptor": null,
        "status": "draft",
        "metadata": null,
        "customer": {
            "id": "cus_xxxxx",
            "name": "Test Customer",
            "email": "test@example.com"
        },
        "payment_intent": null,
        "payment_settings": {
            "payment_methods": ["card"]
        },
        "created_at": 1773752596,
        "updated_at": 1773752596
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {},
    "created_at": 1773752596,
    "updated_at": 1773752596
}
```

```json [billing_statement.updated]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "billing_statement.updated",
    "data": {
        "id": "bstm_xxxxx",
        "resource": "billing_statement",
        "amount": 75000,
        "currency": "PHP",
        "customer_id": "cus_xxxxx",
        "description": "Q1 2026 Services",
        "due_at": 1774357865,
        "finalized_at": 0,
        "billing_statement_merchant_name": null,
        "billing_statement_number": "UAEONUMZ-0001",
        "billing_statement_url": "https://bill.payrexhq.com/b/test_bstm_xxxxx_secret_xxxxx",
        "line_items": [
            {
                "id": "bstm_li_xxxxx",
                "resource": "billing_statement_line_item",
                "description": "Domain Renewal — example.com",
                "billing_statement_id": "bstm_xxxxx",
                "livemode": false,
                "quantity": 1,
                "unit_price": 75000,
                "created_at": 1773752597,
                "updated_at": 1773752928
            }
        ],
        "livemode": false,
        "statement_descriptor": null,
        "status": "draft",
        "metadata": null,
        "customer": {
            "id": "cus_xxxxx",
            "name": "Test Customer",
            "email": "test@example.com"
        },
        "payment_intent": null,
        "payment_settings": {
            "payment_methods": ["card"]
        },
        "created_at": 1773752596,
        "updated_at": 1773753066
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {
        "currency": "PHP",
        "customer_id": "cus_xxxxx",
        "description": "March 2026 Invoice",
        "due_at": null
    },
    "created_at": 1773753066,
    "updated_at": 1773753066
}
```

```json [billing_statement.finalized]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "billing_statement.finalized",
    "data": {
        "id": "bstm_xxxxx",
        "resource": "billing_statement",
        "amount": 75000,
        "currency": "PHP",
        "customer_id": "cus_xxxxx",
        "description": "Q1 2026 Services",
        "due_at": 1774357865,
        "finalized_at": 1773753094,
        "billing_statement_merchant_name": null,
        "billing_statement_number": "UAEONUMZ-0001",
        "billing_statement_url": "https://bill.payrexhq.com/b/test_bstm_xxxxx_secret_xxxxx",
        "line_items": [
            {
                "id": "bstm_li_xxxxx",
                "resource": "billing_statement_line_item",
                "description": "Domain Renewal — example.com",
                "billing_statement_id": "bstm_xxxxx",
                "livemode": false,
                "quantity": 1,
                "unit_price": 75000,
                "created_at": 1773752597,
                "updated_at": 1773752928
            }
        ],
        "livemode": false,
        "statement_descriptor": null,
        "status": "open",
        "metadata": null,
        "customer": {
            "id": "cus_xxxxx",
            "name": "Test Customer",
            "email": "test@example.com"
        },
        "payment_intent": {
            "id": "pi_xxxxx",
            "resource": "payment_intent",
            "status": "awaiting_payment_method",
            "livemode": false,
            "created_at": 1773753094,
            "updated_at": 1773753094
        },
        "payment_settings": {
            "payment_methods": ["card"]
        },
        "created_at": 1773752596,
        "updated_at": 1773753094
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {
        "status": "draft"
    },
    "created_at": 1773753094,
    "updated_at": 1773753094
}
```

```json [billing_statement.sent]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "billing_statement.sent",
    "data": {
        "id": "bstm_xxxxx",
        "resource": "billing_statement",
        "amount": 75000,
        "currency": "PHP",
        "customer_id": "cus_xxxxx",
        "description": "Q1 2026 Services",
        "due_at": 1774357865,
        "finalized_at": 1773753094,
        "billing_statement_merchant_name": null,
        "billing_statement_number": "UAEONUMZ-0001",
        "billing_statement_url": "https://bill.payrexhq.com/b/test_bstm_xxxxx_secret_xxxxx",
        "line_items": [
            {
                "id": "bstm_li_xxxxx",
                "resource": "billing_statement_line_item",
                "description": "Domain Renewal — example.com",
                "billing_statement_id": "bstm_xxxxx",
                "livemode": false,
                "quantity": 1,
                "unit_price": 75000,
                "created_at": 1773752597,
                "updated_at": 1773752928
            }
        ],
        "livemode": false,
        "statement_descriptor": null,
        "status": "open",
        "metadata": null,
        "customer": {
            "id": "cus_xxxxx",
            "name": "Test Customer",
            "email": "test@example.com"
        },
        "payment_intent": {
            "id": "pi_xxxxx",
            "resource": "payment_intent",
            "status": "awaiting_payment_method",
            "livemode": false,
            "created_at": 1773753094,
            "updated_at": 1773753094
        },
        "payment_settings": {
            "payment_methods": ["card"]
        },
        "created_at": 1773752596,
        "updated_at": 1773753094
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {},
    "created_at": 1773753118,
    "updated_at": 1773753118
}
```

```json [billing_statement.paid]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "billing_statement.paid",
    "data": {
        "id": "bstm_xxxxx",
        "resource": "billing_statement",
        "amount": 50000,
        "currency": "PHP",
        "customer_id": "cus_xxxxx",
        "description": "Q1 2026 Services",
        "due_at": 1774404413,
        "finalized_at": 1773799632,
        "billing_statement_merchant_name": null,
        "billing_statement_number": "Z5VKFCVU-0001",
        "billing_statement_url": "https://bill.payrexhq.com/b/test_bstm_xxxxx_secret_xxxxx",
        "line_items": [
            {
                "id": "bstm_li_xxxxx",
                "resource": "billing_statement_line_item",
                "description": "Monthly Hosting (Pro Plan)",
                "billing_statement_id": "bstm_xxxxx",
                "livemode": false,
                "quantity": 1,
                "unit_price": 50000,
                "created_at": 1773799597,
                "updated_at": 1773799597
            }
        ],
        "livemode": false,
        "statement_descriptor": null,
        "status": "paid",
        "metadata": null,
        "customer": {
            "id": "cus_xxxxx",
            "name": "Test Customer",
            "email": "test@example.com"
        },
        "payment_intent": {
            "id": "pi_xxxxx",
            "resource": "payment_intent",
            "latest_payment": "pay_xxxxx",
            "status": "succeeded",
            "livemode": false,
            "created_at": 1773799632,
            "updated_at": 1773799669
        },
        "payment_settings": {
            "payment_methods": ["card"]
        },
        "created_at": 1773799597,
        "updated_at": 1773799669
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {
        "status": "open"
    },
    "created_at": 1773799670,
    "updated_at": 1773799670
}
```

```json [billing_statement.voided]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "billing_statement.voided",
    "data": {
        "id": "bstm_xxxxx",
        "resource": "billing_statement",
        "amount": 50000,
        "currency": "PHP",
        "customer_id": "cus_xxxxx",
        "description": "Q1 2026 Services",
        "due_at": 1774405313,
        "finalized_at": 1773800524,
        "billing_statement_url": "https://bill.payrexhq.com/b/test_bstm_xxxxx_secret_xxxxx",
        "status": "void",
        "metadata": null,
        "customer": {
            "id": "cus_xxxxx",
            "name": "Test Customer",
            "email": "test@example.com"
        },
        "payment_intent": {
            "id": "pi_xxxxx",
            "resource": "payment_intent",
            "status": "canceled",
            "livemode": false
        },
        "payment_settings": {
            "payment_methods": ["card"]
        },
        "created_at": 1773800490,
        "updated_at": 1773800535
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {
        "status": "open"
    },
    "created_at": 1773800535,
    "updated_at": 1773800535
}
```

```json [billing_statement.marked_uncollectible]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "billing_statement.marked_uncollectible",
    "data": {
        "id": "bstm_xxxxx",
        "resource": "billing_statement",
        "amount": 50000,
        "currency": "PHP",
        "customer_id": "cus_xxxxx",
        "description": "Q1 2026 Services",
        "due_at": 1774402259,
        "finalized_at": 1773797474,
        "billing_statement_url": "https://bill.payrexhq.com/b/test_bstm_xxxxx_secret_xxxxx",
        "status": "uncollectible",
        "metadata": null,
        "customer": {
            "id": "cus_xxxxx",
            "name": "Test Customer",
            "email": "test@example.com"
        },
        "payment_intent": {
            "id": "pi_xxxxx",
            "resource": "payment_intent",
            "status": "canceled",
            "livemode": false
        },
        "payment_settings": {
            "payment_methods": ["card"]
        },
        "created_at": 1773797434,
        "updated_at": 1773797556
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {
        "status": "open"
    },
    "created_at": 1773797556,
    "updated_at": 1773797556
}
```

```json [billing_statement.deleted]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "billing_statement.deleted",
    "data": {
        "id": "bstm_xxxxx",
        "resource": "billing_statement",
        "amount": 50000,
        "currency": "PHP",
        "customer_id": "cus_xxxxx",
        "description": "March 2026 Invoice",
        "due_at": 0,
        "finalized_at": 0,
        "billing_statement_url": "https://bill.payrexhq.com/b/test_bstm_xxxxx_secret_xxxxx",
        "status": "draft",
        "metadata": null,
        "customer": {
            "id": "cus_xxxxx",
            "name": "Test Customer",
            "email": "test@example.com"
        },
        "payment_intent": null,
        "payment_settings": {
            "payment_methods": ["card"]
        },
        "created_at": 1773797864,
        "updated_at": 1773797945
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {},
    "created_at": 1773797945,
    "updated_at": 1773797945
}
```

:::

### Billing Statement Line Item Events

::: code-group

```json [billing_statement_line_item.created]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "billing_statement_line_item.created",
    "data": {
        "id": "bstm_li_xxxxx",
        "resource": "billing_statement_line_item",
        "description": "Monthly Hosting (Pro Plan)",
        "billing_statement_id": "bstm_xxxxx",
        "livemode": false,
        "quantity": 1,
        "unit_price": 50000,
        "created_at": 1773752597,
        "updated_at": 1773752597
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {},
    "created_at": 1773752597,
    "updated_at": 1773752597
}
```

```json [billing_statement_line_item.updated]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "billing_statement_line_item.updated",
    "data": {
        "id": "bstm_li_xxxxx",
        "resource": "billing_statement_line_item",
        "description": "Domain Renewal — example.com",
        "billing_statement_id": "bstm_xxxxx",
        "livemode": false,
        "quantity": 1,
        "unit_price": 75000,
        "created_at": 1773752597,
        "updated_at": 1773752928
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {
        "quantity": 1,
        "unit_price": 50000,
        "description": "Monthly Hosting (Pro Plan)"
    },
    "created_at": 1773752928,
    "updated_at": 1773752928
}
```

```json [billing_statement_line_item.deleted]
{
    "id": "evt_xxxxx",
    "resource": "event",
    "type": "billing_statement_line_item.deleted",
    "data": {
        "id": "bstm_li_xxxxx",
        "resource": "billing_statement_line_item",
        "description": "Monthly Hosting (Pro Plan)",
        "billing_statement_id": "bstm_xxxxx",
        "livemode": false,
        "quantity": 1,
        "unit_price": 50000,
        "created_at": 1773797789,
        "updated_at": 1773797789
    },
    "livemode": false,
    "pending_webhooks": 1,
    "previous_attributes": {},
    "created_at": 1773797811,
    "updated_at": 1773797811
}
```

:::

::: info Note on Payloads
These payloads were captured from PayRex test mode webhooks. Production (`livemode: true`) payloads have the same structure.
:::

## Further Reading

- [Configuration — Webhook Settings](/guide/configuration#webhook-configuration) — Webhook path, secret, and tolerance
- [Artisan Commands](/guide/artisan-commands) — Create, list, update, and test webhook endpoints via CLI
- [Webhooks API](/api/webhooks-resource) — Manage webhook endpoints programmatically
- [Enums — WebhookEventType](/guide/enums#webhookeventtype) — All event type values
