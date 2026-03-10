---
title: Payments API
description: Retrieve payment details including billing info, fees, net amount, and payment method. Update description and metadata.
---

# Payments

A payment represents a successful or failed charge against a payment method. Payments are created automatically when a payment intent succeeds — you don't create them directly.

## Retrieve a Payment

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$payment = Payrex::payments()->retrieve('pay_xxxxx'); // [!code focus]

echo $payment->amount;          // 4569600 // [!code focus:5]
echo $payment->fee;             // 2500
echo $payment->netAmount;       // 4549257
echo $payment->status;          // PaymentStatus::Paid
echo $payment->refunded;        // false
echo $payment->billing['name'];           // 'Juan Dela Cruz'
echo $payment->billing['email'];          // 'juan@example.com'
echo $payment->paymentMethod['type'];     // 'card'
echo $payment->paymentMethod['card']['brand']; // 'visa'
```

**Returns a [Payment](#payment-resource) resource.**

**Example Response:**

```json
{
    "id": "pay_xxxxx",
    "resource": "payment",
    "amount": 4569600,
    "amount_refunded": 0,
    "billing": {
        "name": "Juan Dela Cruz",
        "email": "juan@example.com",
        "phone": null,
        "address": {
            "line1": "123453",
            "line2": null,
            "city": "Pasay",
            "state": "Metro Manila",
            "postal_code": "1829",
            "country": "PH"
        }
    },
    "currency": "PHP",
    "description": null,
    "fee": 2500,
    "livemode": false,
    "metadata": null,
    "net_amount": 4549257,
    "payment_intent_id": "pi_xxxxx",
    "payment_method": {
        "type": "card",
        "card": {
            "first6": "511111",
            "last4": "1111",
            "brand": "visa"
        }
    },
    "status": "paid",
    "customer": null,
    "page_session": null,
    "refunded": false,
    "created_at": 1747235098,
    "updated_at": 1747263620
}
```

### Billing Object

Contains the billing details collected during payment:

```json
{
    "name": "Juan Dela Cruz",
    "email": "juan@example.com",
    "phone": null,
    "address": {
        "line1": "123453",
        "line2": null,
        "city": "Pasay",
        "state": "Metro Manila",
        "postal_code": "1829",
        "country": "PH"
    }
}
```

### Payment Method Object

The structure depends on the payment method type used.

**Card payment:**
```json
{
    "type": "card",
    "card": {
        "first6": "511111",
        "last4": "1111",
        "brand": "visa"
    }
}
```

**QR PH payment:**
```json
{
    "type": "qrph",
    "qrph": {
        "account_name": "Juan Dela Cruz",
        "last4_account_number": "7890",
        "account_institution": "BPIXXXXX",
        "account_institution_name": "BPI"
    }
}
```

**GCash payment:**
```json
{
    "type": "gcash",
    "gcash": {
        "account_name": "Juan Dela Cruz",
        "account_number": "09171234567"
    }
}
```

**Maya payment:**
```json
{
    "type": "maya",
    "maya": {
        "account_name": "Juan Dela Cruz",
        "account_number": "09171234567"
    }
}
```

### Page Session Object

Present when the payment was processed through [PayRex Pages](https://docs.payrex.com). Contains custom field data and line items from the checkout. `null` for payments created via Payment Intents or Elements.

```json
{
    "custom_fields": [
        {
            "id": "cf_xxxxx",
            "name": "Company Name",
            "value": "Acme Corp"
        }
    ],
    "line_items": [
        {
            "id": "li_xxxxx",
            "price_id": "price_xxxxx",
            "price_amount": 99900,
            "price_description": "Monthly subscription",
            "product_id": "prod_xxxxx",
            "product_name": "Pro Plan",
            "product_description": "Full access to all features",
            "quantity": "1",
            "total_amount": 99900
        }
    ]
}
```

| Field | Type | Description |
|---|---|---|
| `custom_fields` | array | Custom fields collected from the customer during checkout |
| `custom_fields[].id` | string | Unique identifier of the custom field |
| `custom_fields[].name` | string | Name of the custom field |
| `custom_fields[].value` | string | Value provided by the customer |
| `line_items` | array | Products purchased (only for Pages with storefront template) |
| `line_items[].id` | string | Unique identifier of the line item |
| `line_items[].price_id` | string | Unique identifier of the Price resource |
| `line_items[].price_amount` | integer | Base amount of the Price resource in cents |
| `line_items[].price_description` | string | Description of the Price resource |
| `line_items[].product_id` | string | ID of the Product resource |
| `line_items[].product_name` | string | Name of the Product resource |
| `line_items[].product_description` | string | Description of the Product resource |
| `line_items[].quantity` | string | Quantity selected by the customer |
| `line_items[].total_amount` | number | Quantity multiplied by price amount |

::: tip Accessing Page Session Data
```php
$payment = Payrex::payments()->retrieve('pay_xxxxx');

// Access via the pageSession property (array)
$customFields = $payment->pageSession['custom_fields'] ?? [];
$lineItems = $payment->pageSession['line_items'] ?? [];

// Or via array access on the raw response
$customFields = $payment['page_session']['custom_fields'] ?? [];
```
:::

## Update a Payment

Update a payment's description or metadata:

::: code-group

```php [Basic]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$payment = Payrex::payments()->update('pay_xxxxx', [
    'description' => 'ORD-2026-0042',
]);
```

```php [With Metadata]
use LegionHQ\LaravelPayrex\Facades\Payrex;

$payment = Payrex::payments()->update('pay_xxxxx', [
    'description' => 'ORD-2026-0042',
    'metadata' => ['order_id' => 'ORD-001', 'updated' => 'true'],
]);
```

:::

**Returns a [Payment](#payment-resource) resource.**

**Example Response:**

```json
{
    "id": "pay_xxxxx",
    "resource": "payment",
    "amount": 4569600,
    "amount_refunded": 0,
    "billing": {
        "name": "Juan Dela Cruz",
        "email": "juan@example.com",
        "phone": null,
        "address": {
            "line1": "123453",
            "line2": null,
            "city": "Pasay",
            "state": "Metro Manila",
            "postal_code": "1829",
            "country": "PH"
        }
    },
    "currency": "PHP",
    "description": "ORD-2026-0042",
    "fee": 2500,
    "livemode": false,
    "metadata": {
        "order_id": "ORD-001",
        "updated": "true"
    },
    "net_amount": 4549257,
    "payment_intent_id": "pi_xxxxx",
    "payment_method": {
        "type": "card",
        "card": {
            "first6": "511111",
            "last4": "1111",
            "brand": "visa"
        }
    },
    "status": "paid",
    "customer": null,
    "page_session": null,
    "refunded": false,
    "created_at": 1747235098,
    "updated_at": 1747263700
}
```

## Payment Resource

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (`pay_` prefix) |
| `resource` | string | Always `payment` |
| `amount` | integer | Payment amount in cents |
| `amount_refunded` | integer | Total refunded amount in cents |
| `billing` | object | Customer billing information ([see below](#billing-object)) |
| `currency` | string | Three-letter ISO currency code |
| `description` | string\|null | Reference text |
| `fee` | integer | PayRex transaction fee in cents |
| `net_amount` | integer | Amount transferred to your account (`amount - fee`) |
| `payment_intent_id` | string | Associated payment intent ID |
| `payment_method` | object | Payment method details ([see below](#payment-method-object)) |
| `status` | string | `paid` or `failed` (see [PaymentStatus](/guide/enums#paymentstatus)) |
| `customer` | string\|[Customer](/api/customers)\|null | Associated customer (string ID or expanded `Customer` object) |
| `page_session` | object\|null | Page session details when payment originated from PayRex Pages ([see below](#page-session-object)) |
| `refunded` | boolean | Whether the payment has been refunded |
| `metadata` | object\|null | Key-value pairs |
| `livemode` | boolean | Live or test mode |
| `created_at` | integer | Unix timestamp |
| `updated_at` | integer | Unix timestamp |

::: tip Property Access
Response field names above are shown in `snake_case` (matching the raw API response). In PHP, access them as **camelCase** typed properties on the DTO — e.g., `amount_refunded` becomes `$payment->amountRefunded`. See [Response Data](/guide/response-data) for details.
:::

## Further Reading

- [Payment Intents API](/api/payment-intents) — Create and manage payment intents
- [Refunds API](/api/refunds) — Refund a payment
- [Webhook Handling](/guide/webhooks) — Handle payment events
