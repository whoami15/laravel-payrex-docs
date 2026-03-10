---
title: Response Data
description: Work with typed, immutable DTOs - camelCase properties, enum casting, array access, and response metadata from PayRex API calls.
---

# Response Data

All API methods return **typed, immutable data objects** — not plain arrays. Each resource has its own class (e.g., `PaymentIntent`, `Customer`, `Refund`) extending `PayrexObject`, with `readonly` camelCase properties:

```php
use LegionHQ\LaravelPayrex\Data\PaymentIntent;

$paymentIntent = Payrex::paymentIntents()->create([...]); // Returns PaymentIntent

// Typed properties (recommended) — camelCase with full IDE autocompletion
$paymentIntent->id;              // 'pi_xxxxx' // [!code focus:6]
$paymentIntent->amount;          // 10000
$paymentIntent->status;          // PaymentIntentStatus::AwaitingPaymentMethod (enum)
$paymentIntent->clientSecret;    // 'pi_xxxxx_secret_xxxxx'
$paymentIntent->livemode;        // false
$paymentIntent->createdAt;       // 1700407880

// Nested objects are arrays — access with array syntax
$paymentIntent->nextAction['redirect_url'];
$paymentIntent->paymentMethodOptions['card']['capture_type'];

// Expandable fields depend on the API response:
// When the API returns the full nested object, access as a typed DTO
$paymentIntent->latestPayment->id;     // 'pay_xxxxx' (Payment object)
$paymentIntent->customer->name;        // 'Juan Dela Cruz' (Customer object)
// When the API returns only the ID string, the property remains a string
$paymentIntent->latestPayment;         // 'pay_xxxxx' (string)

// Array access also works — snake_case keys matching the raw API response
$paymentIntent['id'];            // 'pi_xxxxx' // [!code focus:2]
$paymentIntent['status'];        // 'awaiting_payment_method' (raw string, not enum)

// Convert to array or JSON
$paymentIntent->toArray();
json_encode($paymentIntent);
```

::: tip Typed properties vs array access
- **Typed properties** (`->status`) return enum instances (e.g., `PaymentIntentStatus::Succeeded`) and provide IDE autocompletion.
- **Array access** (`['status']`) returns the raw string value (`'succeeded'`) — useful for serialization or when you need the raw API value.

Both are valid. We recommend typed properties for application logic and array access when you need raw values.
:::

::: warning Immutable objects
All data objects are **read-only**. Attempting to set or unset a property via array access will throw a `LogicException`:

```php
$paymentIntent['amount'] = 5000; // throws LogicException
unset($paymentIntent['amount']); // throws LogicException
```
:::

## Response Metadata

After any API call, you can inspect response headers (request IDs, rate limit info) via `getLastResponse()`:

```php
$paymentIntent = Payrex::paymentIntents()->create([...]);

$metadata = Payrex::getLastResponse(); // [!code focus]
$metadata->statusCode;                // 200 // [!code focus]
$metadata->header('X-Request-Id');    // 'req_abc123' (case-insensitive) // [!code focus]
```

See [Response Metadata](/guide/error-handling#response-metadata) for full details.

## Further Reading

- [Error Handling](/guide/error-handling) — Exception types, error codes, and response metadata
- [Enums](/guide/enums) — All status and type enum values
- [Pagination](/guide/pagination) — Navigate paginated results with auto-pagination
