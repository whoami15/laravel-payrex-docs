---
title: Billable Customer
description: HasPayrexCustomer trait to link Eloquent models to PayRex customers - create, retrieve, update, and delete customers from your User model.
---

# Billable Customer

The package provides a `HasPayrexCustomer` trait that links an Eloquent model — typically your `User` — to a PayRex customer record. This gives you convenient methods like `$user->createAsPayrexCustomer()` and `$user->asPayrexCustomer()` without manually juggling customer IDs.

::: tip When to use this
Use the Billable Customer trait when your app has user accounts and you want to associate PayRex customers with them. If you're accepting one-off payments without user accounts, you can skip this and use the [Customers API](/api/customers) directly.
:::

## Setup

### 1. Publish and Run the Migration

The package includes a migration that adds a `payrex_customer_id` column to your `users` table:

```bash
php artisan vendor:publish --tag="payrex-migrations"
php artisan migrate
```

This creates a nullable, indexed `payrex_customer_id` string column on the `users` table.

::: info Custom Table
If you want to use a different table (e.g., `teams` or `organizations`), copy the published migration and adjust the table name before running it.
:::

### 2. Add the Trait to Your Model

Add the `HasPayrexCustomer` trait to your model:

```php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use LegionHQ\LaravelPayrex\Concerns\HasPayrexCustomer;

class User extends Authenticatable
{
    use HasPayrexCustomer; // [!code focus]

    // ...
}
```

That's it. Your model now has PayRex customer management methods.

## Usage

### Create a PayRex Customer

Create a customer in PayRex and automatically store the customer ID on the model:

```php
$customer = $user->createAsPayrexCustomer();

// The user's payrex_customer_id column is now set
echo $user->payrexCustomerId(); // 'cus_xxxxx'
```

By default, the trait uses the model's `name` and `email` attributes and the configured default currency. You can pass additional parameters to override or extend:

```php
$customer = $user->createAsPayrexCustomer([
    'billing_details' => [
        'phone' => '+639171234567',
        'address' => [
            'line1' => '123 Main St',
            'city' => 'Manila',
            'state' => 'NCR',
            'postal_code' => '1000',
            'country' => 'PH',
        ],
    ],
    'billing_statement_prefix' => 'ACME',
    'metadata' => ['plan' => 'premium'],
]);
```

::: warning
Calling `createAsPayrexCustomer()` on a model that already has a PayRex customer ID throws a `LogicException`. Check first with `hasPayrexCustomerId()` if you're unsure:

```php
if (! $user->hasPayrexCustomerId()) {
    $user->createAsPayrexCustomer();
}
```
:::

### Retrieve the PayRex Customer

Fetch the full customer record from the PayRex API:

```php
$customer = $user->asPayrexCustomer();

echo $customer->name;                    // 'Juan Dela Cruz'
echo $customer->email;                   // 'juan@example.com'
echo $customer->billingStatementPrefix;  // 'PKYG9MA2'
```

### Update the PayRex Customer

Update the customer's details in PayRex:

```php
$customer = $user->updatePayrexCustomer([
    'name' => 'Juan Dela Cruz Jr.',
    'billing_details' => [
        'phone' => '+639181234567',
    ],
    'metadata' => ['tier' => 'enterprise'],
]);
```

::: info
This updates the customer in PayRex only. If you also need to update the local model attributes, do that separately.
:::

### Delete the PayRex Customer

Delete the customer from PayRex and clear the stored ID on the model:

```php
$result = $user->deleteAsPayrexCustomer();

echo $user->payrexCustomerId(); // null
```

### Check if a Customer Exists

```php
$customer = $user->hasPayrexCustomerId()
    ? $user->asPayrexCustomer()
    : $user->createAsPayrexCustomer();
```

## Using with Payment Intents

Once your model has a PayRex customer ID, you can associate payments with it:

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$paymentIntent = Payrex::paymentIntents()->create([
    'amount' => 10000,
    'payment_methods' => ['card', 'gcash'],
    'customer_id' => $user->payrexCustomerId(), // [!code focus]
    'description' => 'ORD-2026-0042',
]);
```

## Using with Billing Statements

Create billing statements linked to the customer:

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$statement = Payrex::billingStatements()->create([
    'customer_id' => $user->payrexCustomerId(), // [!code focus]
    'payment_settings' => [
        'payment_methods' => ['card', 'gcash'],
    ],
]);
```

## Customization

The trait provides three methods you can override to customize behavior.

### Custom Name Attribute

If your model uses a different column for the customer name (e.g., `full_name`):

```php
public function payrexCustomerName(): ?string
{
    return $this->full_name;
}
```

### Custom Email Attribute

If your model uses a different column for the customer email:

```php
public function payrexCustomerEmail(): ?string
{
    return $this->contact_email;
}
```

### Custom ID Column

If your migration uses a different column name for the PayRex customer ID:

```php
public function payrexCustomerIdColumn(): string
{
    return 'prx_customer_id';
}
```

Make sure your migration matches:

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('prx_customer_id')->nullable()->index();
});
```

## Available Methods

| Method | Return Type | Description |
|---|---|---|
| `payrexCustomerId()` | `?string` | Get the stored PayRex customer ID |
| `hasPayrexCustomerId()` | `bool` | Check if a PayRex customer ID exists |
| `createAsPayrexCustomer($params)` | `Customer` | Create a PayRex customer and store the ID |
| `asPayrexCustomer()` | `Customer` | Retrieve the PayRex customer |
| `updatePayrexCustomer($params)` | `Customer` | Update the PayRex customer |
| `deleteAsPayrexCustomer()` | `DeletedResource` | Delete the PayRex customer and clear the ID |
| `payrexCustomerName()` | `?string` | Get the name for PayRex (override to customize) |
| `payrexCustomerEmail()` | `?string` | Get the email for PayRex (override to customize) |
| `payrexCustomerIdColumn()` | `string` | Get the ID column name (override to customize) |

## Further Reading

- [Customers API](/api/customers) — Full parameter and response reference
- [Billing Statements](/guide/billing-statements-guide) — Create billing statements linked to customers
- [Payment Methods](/guide/payment-methods) — Available payment methods
