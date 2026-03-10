---
title: Testing
description: Test PayRex API calls with Http::fake(), dispatch synthetic webhook events, assert event dispatching, and fake error responses.
---

# Testing

Tips and patterns for testing your PayRex integration in your Laravel application.

## Testing Webhook Listeners

### Using the Artisan Command

The quickest way to verify your webhook listeners work is the `payrex:webhook-test` command:

```bash
php artisan payrex:webhook-test payment_intent.succeeded
```

This dispatches a synthetic event locally without making any API calls. See [Artisan Commands](/guide/artisan-commands#test-webhook-events) for details.

### Dispatching Events in Tests

In your feature or unit tests, dispatch webhook events directly:

```php
use LegionHQ\LaravelPayrex\Events\PaymentIntentSucceeded;

it('fulfills order on payment success', function () {
    $order = Order::factory()->create(['status' => 'pending']);

    PaymentIntentSucceeded::dispatch([ // [!code focus:13]
        'id' => 'evt_test_123',
        'type' => 'payment_intent.succeeded',
        'livemode' => false,
        'data' => [
            'id' => 'pi_test_456',
            'resource' => 'payment_intent',
            'amount' => 10000,
            'metadata' => ['order_id' => (string) $order->id],
        ],
        'created_at' => now()->timestamp,
        'updated_at' => now()->timestamp,
    ]);

    expect($order->fresh()->status)->toBe('paid');
});
```

### Asserting Events Were Dispatched

Use Laravel's `Event::fake()` to verify that webhook processing dispatches the correct events:

```php
use Illuminate\Support\Facades\Event;
use LegionHQ\LaravelPayrex\Events\PaymentIntentSucceeded;
use LegionHQ\LaravelPayrex\Events\WebhookReceived;

it('dispatches payment intent succeeded event', function () {
    Event::fake([PaymentIntentSucceeded::class, WebhookReceived::class]);

    $payload = json_encode([
        'type' => 'payment_intent.succeeded',
        'data' => ['id' => 'pi_test', 'resource' => 'payment_intent'],
    ]);

    $timestamp = time();
    $signature = hash_hmac('sha256', $timestamp . '.' . $payload, config('payrex.webhook.secret'));

    $this->postJson(route('payrex.webhook'), json_decode($payload, true), [
        'Payrex-Signature' => "t={$timestamp},te={$signature},li=",
    ])->assertOk();

    Event::assertDispatched(WebhookReceived::class);
    Event::assertDispatched(PaymentIntentSucceeded::class);
});
```

## Testing API Calls

### Faking HTTP Responses

Use Laravel's `Http::fake()` to mock PayRex API responses:

```php
use Illuminate\Support\Facades\Http;
use LegionHQ\LaravelPayrex\Facades\Payrex;

it('creates a payment intent', function () {
    Http::fake([ // [!code focus:13]
        'api.payrexhq.com/payment_intents' => Http::response([
            'id' => 'pi_test_123',
            'resource' => 'payment_intent',
            'amount' => 10000,
            'currency' => 'PHP',
            'status' => 'awaiting_payment_method',
            'payment_methods' => ['card'],
            'livemode' => false,
            'created_at' => now()->timestamp,
            'updated_at' => now()->timestamp,
        ]),
    ]);

    $paymentIntent = Payrex::paymentIntents()->create([
        'amount' => 10000,
        'payment_methods' => ['card'],
    ]);

    expect($paymentIntent->id)->toBe('pi_test_123');
    expect($paymentIntent->amount)->toBe(10000);

    Http::assertSent(function ($request) { // [!code focus:4]
        return $request->url() === 'https://api.payrexhq.com/payment_intents'
            && $request['amount'] === 10000;
    });
});
```

### Faking Error Responses

Test your error handling by faking error responses:

```php
use Illuminate\Support\Facades\Http;
use LegionHQ\LaravelPayrex\Exceptions\InvalidRequestException;
use LegionHQ\LaravelPayrex\Facades\Payrex;

it('handles validation errors', function () {
    Http::fake([ // [!code focus:7]
        'api.payrexhq.com/payment_intents' => Http::response([
            'errors' => [
                ['detail' => 'Amount must be a positive integer.', 'code' => 'parameter_below_minimum'],
            ],
        ], 400),
    ]);

    Payrex::paymentIntents()->create(['amount' => -100, 'payment_methods' => ['card']]);
})->throws(InvalidRequestException::class, 'Amount must be a positive integer.'); // [!code focus]
```

### Faking Paginated Responses

```php
use Illuminate\Support\Facades\Http;
use LegionHQ\LaravelPayrex\Facades\Payrex;

it('lists customers with pagination', function () {
    Http::fake([
        'api.payrexhq.com/customers*' => Http::response([
            'resource' => 'list',
            'has_more' => false,
            'data' => [
                [
                    'id' => 'cus_test_1',
                    'resource' => 'customer',
                    'name' => 'Juan Dela Cruz',
                    'email' => 'juan@example.com',
                    'livemode' => false,
                    'created_at' => now()->timestamp,
                    'updated_at' => now()->timestamp,
                ],
            ],
        ]),
    ]);

    $customers = Payrex::customers()->list(['limit' => 10]);

    expect($customers)->toHaveCount(1);
    expect($customers->hasMore)->toBeFalse();
    expect($customers->data[0]->name)->toBe('Juan Dela Cruz');
});
```

::: tip Test Cards
For test card numbers to simulate successful payments, failures, and 3D Secure scenarios, see the [Test Cards](/guide/test-cards) reference.
:::

## Testing with Test API Keys

For integration tests that hit the real PayRex API, use your test mode API keys. Test keys create real resources in PayRex's test environment but don't process real money.

Set test keys in your `phpunit.xml` or `.env.testing`:

```xml
<env name="PAYREX_SECRET_KEY" value="sk_test_your_test_key"/>
<env name="PAYREX_PUBLIC_KEY" value="pk_test_your_test_key"/>
```

::: warning
Integration tests against the real API are slower and may be rate-limited. Reserve them for critical payment flows and use `Http::fake()` for most tests.
:::

## Best Practices

1. **Use `Http::fake()` for unit/feature tests** — Mock API responses instead of hitting the real API. This makes tests fast, reliable, and free from network issues.

2. **Test error handling paths** — Verify your code handles `AuthenticationException`, `InvalidRequestException`, and `ResourceNotFoundException` gracefully.

3. **Test webhook redelivery** — Ensure your listeners handle the same event being delivered twice (PayRex may retry failed deliveries).

4. **Use the webhook test command in CI** — Run `php artisan payrex:webhook-test payment_intent.succeeded` in your CI pipeline to verify listeners are registered.

## Further Reading

- [Artisan Commands](/guide/artisan-commands) — Manage and test webhook endpoints via CLI
- [Error Handling](/guide/error-handling) — Exception types for testing error paths
- [Test Cards](/guide/test-cards) — Card numbers for simulating payment scenarios
- [Webhook Handling](/guide/webhooks) — Event classes and listener setup
