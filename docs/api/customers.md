---
title: Customers API
description: Create, list, retrieve, update, and delete customers with the PayRex Laravel package.
---

# Customers

Manage customer records for associating with payments and billing statements.

## Create a Customer

::: code-group

```php [Basic]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$customer = Payrex::customers()->create([ // [!code focus:4]
    'name' => 'Juan Dela Cruz',       // Required
    'email' => 'juan@example.com',      // Required
]);
```

```php [With Billing Details]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$customer = Payrex::customers()->create([
    'name' => 'Juan Dela Cruz',
    'email' => 'juan@example.com',
    'billing_details' => [ // [!code focus:11]
        'phone' => '+639171234567',
        'address' => [
            'line1' => '123 Main St',
            'line2' => 'Suite 456',
            'city' => 'Manila',
            'state' => 'NCR',
            'postal_code' => '1000',
            'country' => 'PH',
        ],
    ],
    'billing_statement_prefix' => 'JUAN', // [!code focus]
]);
```

```php [With Metadata]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$customer = Payrex::customers()->create([
    'name' => 'Juan Dela Cruz',
    'email' => 'juan@example.com',
    'metadata' => [ // [!code focus:4]
        'user_id' => 'usr_123',
        'plan' => 'premium',
    ],
]);
```

:::

**Returns a [Customer](#customer-resource) resource.**

::: info Currency
The `currency` parameter sets the customer's default currency preference. Like other resources, it is automatically populated from your `PAYREX_CURRENCY` config if not provided explicitly.
:::

**Example Response:**

```json
{
    "id": "cus_xxxxx",
    "resource": "customer",
    "billing_statement_prefix": "PKYG9MA2",
    "billing": null,
    "email": "juan@example.com",
    "currency": "PHP",
    "livemode": false,
    "metadata": null,
    "name": "Juan Dela Cruz",
    "next_billing_statement_sequence_number": "1",
    "created_at": 1721726975,
    "updated_at": 1721726975
}
```

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Customer name |
| `email` | string | Yes | Customer email |
| `currency` | string | No | Customer's currency preference. Defaults to config `PAYREX_CURRENCY`. |
| `billing_details` | object | No | Phone and address (see below) |
| `billing_statement_prefix` | string | No | Billing statement number prefix. Must be 3–15 uppercase letters or numbers (e.g., `ACME`, `CORP123`). |
| `next_billing_statement_sequence_number` | integer | No | Next sequence number |
| `metadata` | object | No | Key-value pairs |

::: info Billing Statement Prefix
If you don't provide a `billing_statement_prefix` when creating a customer, PayRex automatically generates a random alphanumeric prefix (e.g., `PKYG9MA2`). This prefix is used to number billing statements for the customer (e.g., `PKYG9MA2-0001`). The prefix must be 3–15 characters, uppercase letters and numbers only.
:::

### Billing Details Object

```php
'billing_details' => [
    'phone' => '+639171234567',
    'address' => [
        'line1' => '123 Main St',   // Street address
        'line2' => 'Suite 456',     // Optional
        'city' => 'Manila',
        'state' => 'NCR',
        'postal_code' => '1000',
        'country' => 'PH',          // Two-letter ISO code
    ],
],
```

## List Customers

::: tip Finding a customer without the ID
If you don't have the PayRex customer ID but know the customer's email, name, or metadata, use `list()` with filters as a lookup alternative to `retrieve()`:
```php
$customers = Payrex::customers()->list([
    'email' => 'juan@example.com',
]);

$customer = $customers->data[0] ?? null; // First match
```
:::

::: code-group

```php [Basic]
$customers = Payrex::customers()->list([
    'limit' => 10,
]);

foreach ($customers->data as $customer) {
    echo $customer->name;
}

if ($customers->hasMore) {
    // Fetch next page
}
```

```php [With Filters]
// Search by name
$customers = Payrex::customers()->list([
    'name' => 'Juan',
    'limit' => 10,
]);

// Search by email
$customers = Payrex::customers()->list([
    'email' => 'juan@example.com',
]);

// Search by metadata
$customers = Payrex::customers()->list([
    'metadata' => ['internal_id' => '12345'],
]);
```

:::

**Returns a list of [Customer](#customer-resource) resources.**

### List Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `limit` | int | No | Number of results (min: 1, max: 100) |
| `before` | string | No | Cursor for backward pagination (resource ID) |
| `after` | string | No | Cursor for forward pagination (resource ID) |
| `name` | string | No | Search customers by name |
| `email` | string | No | Search customers by email address |
| `metadata` | object | No | Search customers by stored metadata (e.g., `['internal_id' => '12345']`) |

**Example Response:**

```json
{
    "resource": "list",
    "data": [
        {
            "id": "cus_xxxxx",
            "resource": "customer",
            "billing_statement_prefix": "PKYG9MA2",
            "billing": null,
            "email": "juan@example.com",
            "currency": "PHP",
            "livemode": false,
            "metadata": null,
            "name": "Juan Dela Cruz",
            "next_billing_statement_sequence_number": "1",
            "created_at": 1721726975,
            "updated_at": 1721726975
        },
        {
            "id": "cus_yyyyy",
            "resource": "customer",
            "billing_statement_prefix": "MARIA",
            "billing": null,
            "email": "maria@example.com",
            "currency": "PHP",
            "livemode": false,
            "metadata": null,
            "name": "Maria Santos",
            "next_billing_statement_sequence_number": "1",
            "created_at": 1721727000,
            "updated_at": 1721727000
        }
    ],
    "has_more": false
}
```

### Pagination

```php
// In a controller — returns a CursorPaginator for UI pagination
$customers = Payrex::customers()->paginate(perPage: 10);
```

See [Pagination](/guide/pagination) for more details on cursor-based pagination.

## Retrieve a Customer

```php
$customer = Payrex::customers()->retrieve('cus_xxxxx');

echo $customer->name;                          // 'Juan Dela Cruz'
echo $customer->email;                         // 'juan@example.com'
echo $customer->billingStatementPrefix;        // 'PKYG9MA2'
echo $customer->currency;                      // 'PHP'
```

**Returns a [Customer](#customer-resource) resource.**

## Update a Customer

::: code-group

```php [Basic]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$customer = Payrex::customers()->update('cus_xxxxx', [
    'name' => 'Juan Dela Cruz Jr.',
    'email' => 'juan.jr@example.com',
]);
```

```php [With Billing Details]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$customer = Payrex::customers()->update('cus_xxxxx', [
    'name' => 'Juan Dela Cruz Jr.',
    'billing_details' => [
        'phone' => '+639181234567',
        'address' => [
            'line1' => '456 Updated St',
            'city' => 'Quezon City',
            'state' => 'NCR',
            'postal_code' => '1100',
            'country' => 'PH',
        ],
    ],
]);
```

```php [With Metadata]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$customer = Payrex::customers()->update('cus_xxxxx', [
    'metadata' => ['tier' => 'premium'],
]);
```

:::

**Returns a [Customer](#customer-resource) resource.**

**Example Response:**

```json
{
    "id": "cus_xxxxx",
    "resource": "customer",
    "billing_statement_prefix": "PKYG9MA2",
    "billing": {
        "phone": "+639181234567",
        "address": {
            "line1": "456 Updated St",
            "line2": null,
            "city": "Quezon City",
            "state": "NCR",
            "postal_code": "1100",
            "country": "PH"
        }
    },
    "email": "juan.jr@example.com",
    "currency": "PHP",
    "livemode": false,
    "metadata": null,
    "name": "Juan Dela Cruz Jr.",
    "next_billing_statement_sequence_number": "1",
    "created_at": 1721726975,
    "updated_at": 1721727100
}
```

## Delete a Customer

```php
$result = Payrex::customers()->delete('cus_xxxxx');
```

**Returns a [Deleted Resource](/api/deleted-resource).**

**Example Response:**

```json
{
    "id": "cus_xxxxx",
    "resource": "customer",
    "deleted": true
}
```

::: info Deleted Customers
Deleted customers can still be retrieved via `retrieve()`. The returned object will include a `deleted: true` field. This is useful for auditing or displaying historical data.
:::

## Customer Resource

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (`cus_` prefix) |
| `resource` | string | Always `customer` |
| `name` | string | Customer name |
| `email` | string | Customer email |
| `currency` | string | Three-letter ISO currency code |
| `billing_statement_prefix` | string\|null | Billing statement number prefix |
| `next_billing_statement_sequence_number` | string | Next sequence number |
| `billing` | object\|null | Phone and address details |
| `metadata` | object\|null | Key-value pairs |
| `livemode` | boolean | Live or test mode |
| `created_at` | integer | Unix timestamp |
| `updated_at` | integer | Unix timestamp |

::: tip Property Access
Response field names above are shown in `snake_case` (matching the raw API response). In PHP, access them as **camelCase** typed properties on the DTO — e.g., `billing_statement_prefix` becomes `$customer->billingStatementPrefix`. See [Response Data](/guide/response-data) for details.
:::

## Further Reading

- [Billable Customer](/guide/billable-customer) — Link your User model to PayRex customers
- [Billing Statements API](/api/billing-statements) — Create billing statements for customers
- [Pagination](/guide/pagination) — Paginate through customer lists
