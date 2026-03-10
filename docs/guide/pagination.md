---
title: Pagination
description: Cursor-based pagination for customers, billing statements, payout transactions, and webhooks.
---

# Pagination

Resources that return lists of items (customers, billing statements, webhooks) use cursor-based pagination. The package provides `paginate()` for Laravel `CursorPaginator` integration and `list()` for manual cursor control.

## Manual Pagination with `list()`

List methods return a `PayrexCollection` with a `data` array and a `hasMore` flag. Use the `after` parameter with the last item's ID to fetch the next page:

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$customers = Payrex::customers()->list(['limit' => 10]);

foreach ($customers->data as $customer) {
    echo $customer->name;
}

// Next page
if ($customers->hasMore) {
    $lastId = end($customers->data)->id;
    $customers = Payrex::customers()->list(['limit' => 10, 'after' => $lastId]);
}
```

| Parameter | Type | Description |
|---|---|---|
| `limit` | `int` | Number of items to return (default varies by resource) |
| `after` | `string` | Return items after this resource ID (forward pagination) |
| `before` | `string` | Return items before this resource ID (backward pagination) |

## Cursor Pagination with `paginate()`

For paginated UI views (tables, lists), use `paginate()` on any listable resource. It returns a Laravel `CursorPaginator` with automatic cursor resolution from the request:

```php
$customers = Payrex::customers()->paginate(perPage: 10); // [!code focus]
```

`paginate()` reads the `?cursor=` query parameter from the request automatically — "next page" and "previous page" links work out of the box.

### With Blade

```php
// Controller
return view('customers.index', [
    'customers' => Payrex::customers()->paginate(10),
]);
```

```blade
{{-- View --}}
@foreach ($customers as $customer)
    {{ $customer->name }}
@endforeach

{{ $customers->links() }}
```

### With Inertia

Use `withQueryString()` to preserve filters and other query parameters across pages:

```php
// Controller
return Inertia::render('Customers/Index', [
    'customers' => Payrex::customers()->paginate( // [!code focus:4]
        perPage: 10,
        params: ['name' => $request->input('name')],
    )->withQueryString(),
]);
```

The frontend receives a standard `CursorPaginator` JSON response:

```json
{
    "data": [...],
    "path": "https://example.com/customers",
    "per_page": 10,
    "next_cursor": "eyJpZCI6...",
    "next_page_url": "https://example.com/customers?cursor=eyJ...&name=Juan",
    "prev_cursor": null,
    "prev_page_url": null
}
```

### Passing Filters

Pass additional filter parameters alongside pagination:

```php
$customers = Payrex::customers()->paginate(
    perPage: 10,
    params: ['name' => 'Juan'], // [!code focus]
);
```

### Filtering and Lookup

Some resources support filter parameters alongside pagination — useful both for narrowing results and as a **lookup alternative to `retrieve()`** when you don't have the resource ID.

::: tip Use `list()` as a find/lookup
If you know a customer's email but not their PayRex ID, use `list()` with filters instead of `retrieve()`:
```php
$customers = Payrex::customers()->list([
    'email' => 'juan@example.com',
]);

$customer = $customers->data[0] ?? null; // First match
```
:::

Filters work with both `list()` and `paginate()`:

```php
// Paginate through customers named "Juan"
$juans = Payrex::customers()->paginate(
    perPage: 50,
    params: ['name' => 'Juan'],
);

// Filter by metadata
$customers = Payrex::customers()->list([
    'metadata' => ['internal_id' => '12345'],
]);
```

#### Resources with Filter Support

| Resource | Available Filters |
|---|---|
| [Customers](/api/customers#list-customers) | `name`, `email`, `metadata` |
| [Webhooks](/api/webhooks-resource#list-webhook-endpoints) | `url`, `description` |

Billing Statements and Payout Transactions support `list()` with pagination parameters (`limit`, `before`, `after`) but do not support additional filters.

## PayrexCollection Properties

| Property | Type | Description |
|---|---|---|
| `$collection->data` | `array<PayrexObject>` | Array of items on the current page |
| `$collection->hasMore` | `bool` | Whether more items exist beyond this page |
| `$collection->resource` | `?string` | The resource type (e.g., `list`) |

`PayrexCollection` implements `Countable`, `IteratorAggregate`, `ArrayAccess`, and `JsonSerializable`:

```php
$customers = Payrex::customers()->list();

// Countable
echo count($customers); // Number of items on this page

// IteratorAggregate — iterate directly
foreach ($customers as $customer) {
    echo $customer->name;
}

// ArrayAccess
$typedData = $customers['data']; // Same as $customers->data (typed DTOs)

// JSON serializable
$json = json_encode($customers);
```

## Resources with Pagination

| Resource | `list()` | `paginate()` |
|---|---|---|
| Customers | `Payrex::customers()->list(['limit' => 10])` | `Payrex::customers()->paginate(10)` |
| Billing Statements | `Payrex::billingStatements()->list()` | `Payrex::billingStatements()->paginate(10)` |
| Webhooks | `Payrex::webhooks()->list()` | `Payrex::webhooks()->paginate(10)` |
| Payout Transactions | `Payrex::payoutTransactions()->list('po_xxxxx')` | Not available |

::: info Payout Transactions
`payoutTransactions->list()` requires a payout ID as the first argument and does not support `paginate()`. Use manual cursor pagination with `after`/`before` parameters instead. See [Payout Transactions](/api/payout-transactions) for details.
:::

## Further Reading

- [Customers API](/api/customers) — List and filter customers
- [Billing Statements API](/api/billing-statements) — List billing statements
- [Payout Transactions API](/api/payout-transactions) — List payout transactions
- [Webhooks API](/api/webhooks-resource) — List webhook endpoints
