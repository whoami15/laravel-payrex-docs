---
title: Artisan Commands
description: Create, list, update, toggle, and delete webhook endpoints via CLI. Dispatch synthetic webhook events to test your listeners.
---

# Artisan Commands

The package provides artisan commands for managing webhook endpoints and testing event listeners from your terminal.

## Create a Webhook Endpoint

```bash
php artisan payrex:webhook-create
```

Interactively creates a new webhook endpoint. The command prompts you for:

1. **Webhook URL** — Must be a valid URL (validated before submission)
2. **Events** — Multi-select from all available webhook event types, grouped by resource.
3. **Description** — Optional text describing the endpoint's purpose

The three prompts are grouped — press <kbd>Ctrl+U</kbd> at any step to go back and change a previous answer.

After creation, the command displays the endpoint details including the **secret key** — store this as your `PAYREX_WEBHOOK_SECRET` if this is the endpoint your application uses.

```
$ php artisan payrex:webhook-create

 ┌ Webhook URL ─────────────────────────────────────────────────┐
 │ https://example.com/webhooks/payrex                          │
 └──────────────────────────────────────────────────────────────┘

 ┌ Which events should this webhook listen to? ─────────────────┐
 │ Payment Intent — succeeded                                   │
 │ Refund — created                                             │
 └──────────────────────────────────────────────────────────────┘

 ┌ Description ─────────────────────────────────────────────────┐
 │ Handles payments and refunds                                 │
 └──────────────────────────────────────────────────────────────┘

   INFO  Webhook endpoint created successfully.

 ┌─────────────┬─────────────────────────────────────────┐
 │ Field       │ Value                                   │
 ├─────────────┼─────────────────────────────────────────┤
 │ ID          │ wh_xxxxx                                │
 │ URL         │ https://example.com/webhooks/payrex     │
 │ Status      │ enabled                                 │
 │ Events      │ payment_intent.succeeded                │
 │             │ refund.created                          │
 │ Description │ Handles payments and refunds            │
 │ Secret Key  │ whsk_xxxxx                              │
 │ Created At  │ 2026-02-15 10:30:00                     │
 └─────────────┴─────────────────────────────────────────┘
```

::: tip
The secret key is only shown after creation. Copy it immediately and set it as your `PAYREX_WEBHOOK_SECRET` environment variable.
:::

## List Webhook Endpoints

```bash
php artisan payrex:webhook-list
```

Fetches all webhook endpoints from the PayRex API and displays them in a table. The Events column shows the count — use `payrex:webhook-update` to see the full list for a specific endpoint.

```
 ┌──────────┬────────────────────────────────────┬──────────┬──────────┬─────────────────────┐
 │ ID       │ URL                                │ Status   │ Events   │ Created At          │
 ├──────────┼────────────────────────────────────┼──────────┼──────────┼─────────────────────┤
 │ wh_xxxxx │ https://example.com/payrex/webhook │ enabled  │ 2 events │ 2026-02-15 10:30:00 │
 │ wh_yyyyy │ https://staging.example.com/hook   │ disabled │ 1 event  │ 2026-02-10 08:00:00 │
 └──────────┴────────────────────────────────────┴──────────┴──────────┴─────────────────────┘
```

If no endpoints exist, the command displays a warning:

```
 WARN  No webhook endpoints found.
```

::: info
This command makes a live API call using your `PAYREX_SECRET_KEY`. It shows endpoints for the mode matching your key (test or live).
:::

## Update a Webhook Endpoint

```bash
php artisan payrex:webhook-update {id}
```

Updates an existing webhook endpoint. The command retrieves the current endpoint and pre-fills all prompts with the existing values, so you only need to change what's different. Press <kbd>Ctrl+U</kbd> at any step to go back.

```
$ php artisan payrex:webhook-update wh_xxxxx

 ┌ Webhook URL ─────────────────────────────────────────────────┐
 │ https://example.com/webhooks/payrex                          │  ← pre-filled
 └──────────────────────────────────────────────────────────────┘

 ┌ Which events should this webhook listen to? ─────────────────┐
 │ Payment Intent — succeeded                                   │  ← pre-selected
 └──────────────────────────────────────────────────────────────┘

 ┌ Description ─────────────────────────────────────────────────┐
 │ Handles payments                                             │  ← pre-filled
 └──────────────────────────────────────────────────────────────┘

   INFO  Webhook endpoint updated successfully.

 ┌─────────────┬─────────────────────────────────────────┐
 │ Field       │ Value                                   │
 ├─────────────┼─────────────────────────────────────────┤
 │ ID          │ wh_xxxxx                                │
 │ URL         │ https://example.com/webhooks/payrex     │
 │ Status      │ enabled                                 │
 │ Events      │ payment_intent.succeeded                │
 │ Description │ Handles payments                        │
 │ Created At  │ 2026-02-15 10:30:00                     │
 └─────────────┴─────────────────────────────────────────┘
```

::: info
Get the webhook endpoint ID from `payrex:webhook-list`.
:::

## Toggle a Webhook Endpoint

```bash
php artisan payrex:webhook-toggle {id}
```

Toggles a webhook endpoint between enabled and disabled. The command detects the current status and flips it, then displays the updated details.

```
$ php artisan payrex:webhook-toggle wh_xxxxx

   INFO  Webhook endpoint disabled successfully.

 ┌─────────────┬─────────────────────────────────────────┐
 │ Field       │ Value                                   │
 ├─────────────┼─────────────────────────────────────────┤
 │ ID          │ wh_xxxxx                                │
 │ URL         │ https://example.com/webhooks/payrex     │
 │ Status      │ disabled                                │
 │ Events      │ payment_intent.succeeded                │
 │ Description │ Handles payments and refunds            │
 │ Created At  │ 2026-02-15 10:30:00                     │
 └─────────────┴─────────────────────────────────────────┘
```

## Delete a Webhook Endpoint

```bash
php artisan payrex:webhook-delete {id}
```

Deletes a webhook endpoint after showing its details and asking for confirmation. Defaults to **No** to prevent accidental deletion.

```
$ php artisan payrex:webhook-delete wh_xxxxx

 ┌─────────────┬─────────────────────────────────────────┐
 │ Field       │ Value                                   │
 ├─────────────┼─────────────────────────────────────────┤
 │ ID          │ wh_xxxxx                                │
 │ URL         │ https://example.com/webhooks/payrex     │
 │ Status      │ enabled                                 │
 │ Events      │ payment_intent.succeeded                │
 │ Description │ Handles payments and refunds            │
 │ Created At  │ 2026-02-15 10:30:00                     │
 └─────────────┴─────────────────────────────────────────┘

 ┌ Are you sure you want to delete this webhook endpoint? ──────┐
 │ Yes                                                          │
 └──────────────────────────────────────────────────────────────┘

   INFO  Webhook endpoint deleted successfully.
```

If you decline, the command exits without making changes:

```
 WARN  Deletion cancelled.
```

## Test Webhook Events

```bash
php artisan payrex:webhook-test {type?}
```

Dispatches a synthetic webhook event locally for testing your event listeners **without** making any API calls or needing a real webhook delivery.

### Usage

Pass the event type directly:

```bash
# Test a payment success listener
php artisan payrex:webhook-test payment_intent.succeeded

# Test a refund listener
php artisan payrex:webhook-test refund.created

# Test a billing statement event
php artisan payrex:webhook-test billing_statement.paid
```

Or run without an argument to get an interactive search prompt:

```
$ php artisan payrex:webhook-test

 ┌ Search for an event type to simulate ────────────────────────┐
 │ payment_intent                                               │
 ├──────────────────────────────────────────────────────────────┤
 │ › payment_intent.succeeded                                   │
 │   payment_intent.amount_capturable                           │
 └──────────────────────────────────────────────────────────────┘
```

### How It Works

1. Validates the event type against the `WebhookEventType` enum.
2. Builds a synthetic webhook payload with resource-specific fields, correct ID prefixes, and timestamps.
3. Dispatches both the `WebhookReceived` catch-all event and the type-specific event class.

This means your listeners will fire exactly as they would with a real webhook. The payload includes resource-specific fields so you can safely access DTO properties like `$event->data()->amount`, `$event->data()->customerId`, etc.

```php
// Example: payment_intent.succeeded payload
[
    'id' => 'evt_test_aBcDeFgHiJkLmNoPqRsTuVwX',
    'resource' => 'event',
    'type' => 'payment_intent.succeeded',
    'livemode' => false,
    'pending_webhooks' => 0,
    'data' => [
        'id' => 'pi_test_aBcDeFgHiJkLmNoPqRsTuVwX',
        'resource' => 'payment_intent',
        'amount' => 10000,
        'amount_received' => 10000,
        'amount_capturable' => 0,
        'currency' => 'PHP',
        'status' => 'succeeded',
        'payment_methods' => ['card'],
        'latest_payment' => null,
        // ... other payment intent fields
    ],
    'previous_attributes' => [],
    'created_at' => 1709251200,
    'updated_at' => 1709251200,
]

// Example: billing_statement.paid payload
[
    'id' => 'evt_test_...',
    'type' => 'billing_statement.paid',
    'data' => [
        'id' => 'bstm_test_...',
        'resource' => 'billing_statement',
        'amount' => 50000,
        'currency' => 'PHP',
        'status' => 'paid',
        'customer_id' => 'cus_test_...',
        'billing_statement_url' => 'https://bill.payrexhq.com/b/test_...',
        'billing_statement_number' => 'TEST0001-0001',
        'line_items' => [/* ... */],
        'customer' => ['id' => 'cus_test_...', 'name' => 'Test Customer', 'email' => 'test@example.com'],
        'payment_intent' => ['id' => 'pi_test_...', 'status' => 'succeeded', /* ... */],
        // ... other billing statement fields
    ],
]
```

### Valid Event Types

The command accepts any event type from the `WebhookEventType` enum. If you pass an invalid type, it will list all valid options:

```bash
$ php artisan payrex:webhook-test invalid.event

# Output:
#  ERROR  Invalid event type: invalid.event
#
#  ⇂ payment_intent.succeeded
#  ⇂ payment_intent.amount_capturable
#  ⇂ checkout_session.expired
#  ⇂ ...
```

See [Enums > WebhookEventType](/guide/enums#webhookeventtype) for the complete list.

### Example: Testing a Listener

1. Create a listener:

```php
// app/Listeners/HandlePaymentSuccess.php
namespace App\Listeners;

use Illuminate\Support\Facades\Log;
use LegionHQ\LaravelPayrex\Events\PaymentIntentSucceeded;

class HandlePaymentSuccess
{
    public function handle(PaymentIntentSucceeded $event): void // [!code focus:8]
    {
        Log::info('Payment succeeded!', [
            'event_type' => $event->eventType(),
            'data_id' => $event->data()->id,
            'live_mode' => $event->isLiveMode(),
        ]);
    }
}
```

2. Register it:

```php
Event::listen(PaymentIntentSucceeded::class, HandlePaymentSuccess::class);
```

3. Test it:

```bash
php artisan payrex:webhook-test payment_intent.succeeded
# Output:  INFO  Dispatched payment_intent.succeeded event successfully.
```

4. Check your log — the listener should have fired with the mock payload.

## Further Reading

- [Webhook Handling](/guide/webhooks) — Set up event listeners for webhook events
- [Webhooks API](/api/webhooks-resource) — Manage webhook endpoints programmatically
- [Testing](/guide/testing) — Test your integration
