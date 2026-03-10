---
title: Deleted Resource
description: The object returned when a resource is successfully deleted via the PayRex Laravel package.
---

# Deleted Resource

When you delete a resource (e.g., a [Customer](/api/customers#delete-a-customer), [Billing Statement](/api/billing-statements#delete-a-billing-statement), [Billing Statement Line Item](/api/billing-statement-line-items#delete-a-line-item), or [Webhook Endpoint](/api/webhooks-resource#delete-a-webhook-endpoint)), the API returns a `DeletedResource` object confirming the deletion.

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$deleted = Payrex::customers()->delete('cus_xxxxx');

$deleted->id;       // 'cus_xxxxx'
$deleted->resource; // 'customer'
$deleted->deleted;  // true
```

**Example Response:**

```json
{
    "id": "cus_xxxxx",
    "resource": "customer",
    "deleted": true
}
```

## Deleted Resource Object

| Field | Type | Description |
|---|---|---|
| `id` | string | The ID of the deleted resource |
| `resource` | string | The resource type (e.g., `customer`, `billing_statement`, `webhook`) |
| `deleted` | boolean | Always `true` |

::: tip Property Access
Access fields as typed properties on the `DeletedResource` DTO — e.g., `$deleted->id`, `$deleted->deleted`. See [Response Data](/guide/response-data) for details.
:::
