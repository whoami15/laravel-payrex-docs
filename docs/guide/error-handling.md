---
title: Error Handling
description: Handle PayRex API errors with typed exception classes, error codes, and response metadata in Laravel.
---

# Error Handling

The package throws specific exception classes mapped to PayRex API HTTP error codes. All API exceptions are catchable and provide structured error information.

## Exception Hierarchy

```
Exception
└── PayrexException                    # Base for all PayRex errors
    ├── PayrexApiException             # Any API error
    │   ├── AuthenticationException    # 401 — Invalid or missing API key
    │   ├── InvalidRequestException    # 400 — Validation error or bad request
    │   ├── RateLimitException         # 429 — Too many requests
    │   └── ResourceNotFoundException  # 404 — Resource not found
    └── WebhookVerificationException   # Webhook signature verification failure
```

All exceptions are in the `LegionHQ\LaravelPayrex\Exceptions` namespace.

## Catching Exceptions

### Specific Exception Types

Catch specific exceptions to handle different error scenarios:

```php
use LegionHQ\LaravelPayrex\Exceptions\AuthenticationException;
use LegionHQ\LaravelPayrex\Exceptions\InvalidRequestException;
use LegionHQ\LaravelPayrex\Exceptions\ResourceNotFoundException;
use LegionHQ\LaravelPayrex\Exceptions\PayrexApiException;
use LegionHQ\LaravelPayrex\Facades\Payrex;

try {
    $paymentIntent = Payrex::paymentIntents()->create([
        'amount' => 10000,
        'payment_methods' => ['card'],
    ]);
} catch (AuthenticationException $e) { // [!code focus:5]
    // 401 — Invalid API key
    Log::error('PayRex authentication failed', [
        'message' => $e->getMessage(),
    ]);
} catch (InvalidRequestException $e) { // [!code focus:6]
    // 400 — Validation error (e.g., missing required field, invalid amount)
    $errors = $e->errors; // Array of error details from the API
    $detail = $e->getMessage(); // First error message

    return back()->withErrors(['payment' => $detail]);
} catch (ResourceNotFoundException $e) { // [!code focus:3]
    // 404 — Resource not found (e.g., invalid payment intent ID)
    abort(404, 'Payment not found');
} catch (PayrexApiException $e) { // [!code focus:10]
    // Any other API error (5xx, etc.)
    Log::error('PayRex API error', [
        'status' => $e->statusCode,
        'message' => $e->getMessage(),
        'body' => $e->body,
    ]);

    return back()->with('error', 'Payment service temporarily unavailable.');
}
```

### Catch-All for API Errors

Since all API exceptions extend `PayrexApiException`, you can catch any API error with a single handler:

```php
try {
    $paymentIntent = Payrex::paymentIntents()->retrieve('pi_xxxxx');
} catch (PayrexApiException $e) {
    // Handles 400, 401, 404, 500, and any other API error
    Log::error("PayRex error [{$e->statusCode}]: {$e->getMessage()}");
}
```

### Catch-All for All PayRex Errors

Since both `PayrexApiException` and `WebhookVerificationException` extend `PayrexException`, you can catch **all** PayRex-related errors with a single handler:

```php
use LegionHQ\LaravelPayrex\Exceptions\PayrexException;

try {
    // Any PayRex operation...
} catch (PayrexException $e) {
    // Catches both API errors and webhook verification errors
    Log::error("PayRex error: {$e->getMessage()}");
}
```

## Exception Properties

`PayrexApiException` and its subclasses expose these properties:

| Property | Type | Description |
|---|---|---|
| `$e->errors` | `array` | Array of error objects from the API response |
| `$e->statusCode` | `int` | HTTP status code (400, 401, 404, etc.) |
| `$e->body` | `array` | Full JSON response body |
| `$e->getMessage()` | `string` | The first error detail message |

### Error Response Structure

The `errors` array contains objects with details about what went wrong:

```php
try {
    Payrex::paymentIntents()->create(['amount' => -100]);
} catch (InvalidRequestException $e) {
    // $e->errors might contain:
    // [
    //     ['detail' => 'Amount must be a positive integer.', 'code' => 'parameter_below_minimum'],
    // ]

    foreach ($e->errors as $error) {
        echo $error['detail'];
    }
}
```

## Webhook Verification Exception

`WebhookVerificationException` extends `PayrexException` (not `PayrexApiException`) and is thrown when webhook signature verification fails. In practice, the `VerifyWebhookSignature` middleware handles this internally and returns a `403` response — you typically don't need to catch this yourself.

## HTTP Status Code Mapping

| Status Code | Exception Class | Common Causes |
|---|---|---|
| 400 | `InvalidRequestException` | Missing required fields, invalid parameter values |
| 401 | `AuthenticationException` | Invalid, expired, or missing API key |
| 404 | `ResourceNotFoundException` | Invalid resource ID, deleted resource |
| 429 | `RateLimitException` | Too many requests — slow down or implement backoff (see note below) |
| 500+ | `PayrexApiException` | PayRex server error (consider enabling [retries](/guide/configuration#retry-on-server-errors)) |

::: info RateLimitException
PayRex doesn't document rate limiting, but their API may return 429 under heavy load. The package maps this to `RateLimitException` so you can handle it if it happens.
:::

## Error Codes

The `errors` array in the API response contains objects with a `code` and `detail` field. These are the error codes defined by the PayRex API:

| Code | Description |
|---|---|
| `account_activation_required` | Your PayRex merchant account must be activated before handling real transactions |
| `auth_invalid` | Authentication credential is invalid, missing, or uses the wrong key type (Secret vs. Public) |
| `mode_mismatched` | The resource mode does not match the API key mode (e.g., accessing a live resource with a test key) |
| `internal_system_error` | A platform-level issue occurred — contact PayRex support |
| `resource_not_found` | The resource you are trying to retrieve does not exist |
| `parameter_invalid` | One or more attributes in your payload have invalid values |
| `parameter_type_invalid` | One or more attributes in your payload have an invalid data type |
| `parameter_required` | A required attribute is missing from the payload |
| `parameter_above_maximum` | A numeric attribute value exceeds the allowed maximum |
| `parameter_below_minimum` | A numeric attribute value is below the allowed minimum |

For more details, see the [PayRex Error Codes documentation](https://docs.payrex.com/docs/guide/developer_handbook/error_codes).

## Debugging Failed Payments

Some PayRex resources store information about failures. For example, when a Payment Intent encounters a failed payment, you can inspect the `last_payment_error` attribute:

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$paymentIntent = Payrex::paymentIntents()->retrieve('pi_xxxxx');

if ($paymentIntent->lastPaymentError) { // [!code focus:6]
    Log::warning('Payment failed', [
        'payment_intent_id' => $paymentIntent->id,
        'error' => $paymentIntent->lastPaymentError,
    ]);
}
```

This is useful for figuring out why a customer's payment failed without relying on exception handling alone.

## Response Metadata

After any API call, you can inspect response headers and the HTTP status code via `getLastResponse()`. This returns an `ApiResponseMetadata` object with the headers from the most recent request — useful for debugging, logging request IDs, or checking rate limit headers.

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$paymentIntent = Payrex::paymentIntents()->create([
    'amount' => 10000,
    'payment_methods' => ['card'],
]);

$metadata = Payrex::getLastResponse(); // [!code focus]

$metadata->statusCode;                    // 200 // [!code focus]
$metadata->header('X-Request-Id');        // 'req_abc123' // [!code focus]
$metadata->header('x-request-id');        // 'req_abc123' (case-insensitive)
$metadata->header('Nonexistent-Header');  // null
$metadata->headers;                       // ['x-request-id' => 'req_abc123', ...]
```

### After Failed Requests

Response metadata is captured **before** exceptions are thrown, so you can inspect it even after a failed request. This is especially useful for including request IDs in support tickets or bug reports:

```php
use LegionHQ\LaravelPayrex\Exceptions\PayrexApiException;
use LegionHQ\LaravelPayrex\Facades\Payrex;

try {
    Payrex::paymentIntents()->create(['amount' => -100, 'payment_methods' => ['card']]);
} catch (PayrexApiException $e) {
    $metadata = Payrex::getLastResponse(); // [!code focus]

    Log::error('PayRex API error', [
        'status' => $e->statusCode,
        'message' => $e->getMessage(),
        'request_id' => $metadata?->header('X-Request-Id'), // [!code focus]
    ]);
}
```

### ApiResponseMetadata

| Property / Method | Type | Description |
|---|---|---|
| `$metadata->headers` | `array<string, string>` | All response headers (keys are lowercase) |
| `$metadata->statusCode` | `int` | HTTP status code |
| `$metadata->header($name)` | `?string` | Get a header value by name (case-insensitive). Returns `null` if not found. |

::: info
`getLastResponse()` returns `null` before any API request has been made. The metadata is overwritten on each subsequent request, so retrieve it immediately after the call you care about.
:::

## Idempotency Keys

::: warning Not yet supported by PayRex
The PayRex API does not honor the `Idempotency-Key` header yet. The package sends it ahead of time so you won't need any code changes once PayRex adds support. Until then, sending an idempotency key has no effect on the API's behavior.
:::

All `create()` and action methods (e.g., `cancel`, `capture`, `finalize`, `void`) accept an optional `idempotencyKey` parameter. When provided, the package sends an `Idempotency-Key` HTTP header with the request:

```php
// Safely retry without creating duplicate payment intents
Payrex::paymentIntents()->create([
    'amount' => 10000,
    'currency' => 'PHP',
    'payment_methods' => ['card'],
], idempotencyKey: 'order_123_attempt_1'); // [!code focus]

// Also available on action methods
Payrex::paymentIntents()->cancel('pi_xxxxx', idempotencyKey: 'cancel_order_123'); // [!code focus]
Payrex::paymentIntents()->capture('pi_xxxxx', ['amount' => 10000], idempotencyKey: 'capture_order_123'); // [!code focus]

// Billing statement actions
Payrex::billingStatements()->finalize('bstm_xxxxx', idempotencyKey: 'finalize_inv_456'); // [!code focus]
```

## Best Practices

1. **Always catch exceptions on user-facing operations** — Don't let raw API errors surface to your customers.

2. **Log the full error context** — Include `statusCode`, `body`, and `errors` for debugging:

   ```php
   catch (PayrexApiException $e) {
       Log::error('PayRex API error', [
           'status' => $e->statusCode,
           'message' => $e->getMessage(),
           'errors' => $e->errors,
           'request_id' => Payrex::getLastResponse()?->header('X-Request-Id'),
       ]);
   }
   ```

3. **Use specific exception types** — Catch `InvalidRequestException` separately to show validation messages to users, and `AuthenticationException` to alert your ops team.

4. **Enable retries for server errors** — If you get occasional `500` errors, enable [automatic retries](/guide/configuration#retry-on-server-errors). Be cautious with write operations to avoid duplicates.

## Further Reading

- [Configuration — Retry](/guide/configuration#retry-on-server-errors) — Configure automatic retries for server errors
- [Testing](/guide/testing) — Test error handling with `Http::fake()`
- [Enums](/guide/enums) — All status and type enum values
