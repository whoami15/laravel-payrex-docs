---
title: Webhooks API
description: Create, list, retrieve, update, delete, enable, and disable webhook endpoints with the PayRex Laravel package.
---

# Webhooks (API Resource)

Manage webhook endpoints programmatically via the API.

::: tip
For handling incoming webhook events, see the [Webhook Handling](/guide/webhooks) guide.
:::

## Create a Webhook Endpoint

```php
use LegionHQ\LaravelPayrex\Facades\Payrex;

$webhook = Payrex::webhooks()->create([ // [!code focus:5]
    'url' => 'https://example.com/webhooks/shipments',         // Required. HTTPS URL
    'events' => ['payment_intent.succeeded'],                     // Required
    'description' => 'This is the webhook used for sending shipments after receiving successfully paid payments',
]);

// Store the secret_key for signature verification
$secret = $webhook->secretKey; // [!code focus]
```

**Returns a [Webhook Endpoint](#webhook-endpoint-resource) resource.**

::: tip Webhook Secret
The `secret_key` returned here is the signing secret for this webhook endpoint. If this is the endpoint your application uses to receive webhooks, set it as your `PAYREX_WEBHOOK_SECRET` environment variable so the package can verify incoming signatures. You can also find this value in the [PayRex Dashboard](https://dashboard.payrexhq.com/t/developers/webhooks) under each webhook endpoint's details.
:::

**Example Response:**

```json
{
    "id": "wh_xxxxx",
    "resource": "webhook",
    "secret_key": "whsk_xxxxx",
    "status": "enabled",
    "description": "This is the webhook used for sending shipments after receiving successfully paid payments",
    "livemode": false,
    "url": "https://example.com/webhooks/shipments",
    "events": [
        "payment_intent.succeeded"
    ],
    "created_at": 1706056262,
    "updated_at": 1706056471
}
```

## List Webhook Endpoints

::: code-group

```php [Basic]
$webhooks = Payrex::webhooks()->list(['limit' => 10]);

foreach ($webhooks->data as $webhook) {
    echo "{$webhook->url} — {$webhook->status}";
}
```

```php [With Filters]
// Search by URL
$webhooks = Payrex::webhooks()->list([
    'url' => 'https://example.com',
]);

// Search by description
$webhooks = Payrex::webhooks()->list([
    'description' => 'shipments',
]);
```

:::

**Returns a list of [Webhook Endpoint](#webhook-endpoint-resource) resources.**

### List Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `limit` | int | No | Number of results (min: 1, max: 100) |
| `before` | string | No | Cursor for backward pagination (resource ID) |
| `after` | string | No | Cursor for forward pagination (resource ID) |
| `url` | string | No | Search webhooks by URL |
| `description` | string | No | Search webhooks by description |

### Pagination

```php
// In a controller — returns a CursorPaginator for UI pagination
$webhooks = Payrex::webhooks()->paginate(perPage: 10);
```

See [Pagination](/guide/pagination) for more details on cursor-based pagination.

**Example Response:**

```json
{
    "resource": "list",
    "data": [
        {
            "id": "wh_xxxxx",
            "resource": "webhook",
            "secret_key": "whsk_xxxxx",
            "status": "enabled",
            "description": "This is the webhook used for sending shipments after receiving successfully paid payments",
            "livemode": false,
            "url": "https://example.com/webhooks/shipments",
            "events": ["payment_intent.succeeded"],
            "created_at": 1706056262,
            "updated_at": 1706056471
        },
        {
            "id": "wh_yyyyy",
            "resource": "webhook",
            "secret_key": "whsk_yyyyy",
            "status": "disabled",
            "description": "Staging webhook endpoint",
            "livemode": false,
            "url": "https://staging.example.com/webhooks",
            "events": ["billing_statement.created", "billing_statement.paid"],
            "created_at": 1706056300,
            "updated_at": 1706056400
        }
    ],
    "has_more": false
}
```

## Retrieve a Webhook Endpoint

```php
$webhook = Payrex::webhooks()->retrieve('wh_xxxxx');

echo $webhook->url;        // 'https://example.com/webhooks/shipments'
echo $webhook->status;     // WebhookEndpointStatus::Enabled
echo $webhook->secretKey;  // 'whsk_xxxxx'
$webhook->events;          // ['payment_intent.succeeded']
```

**Returns a [Webhook Endpoint](#webhook-endpoint-resource) resource.**

## Update a Webhook Endpoint

```php
$webhook = Payrex::webhooks()->update('wh_xxxxx', [
    'url' => 'https://example.com/webhooks/updated',
    'events' => ['payment_intent.succeeded', 'refund.created'],
    'description' => 'Production order fulfillment webhook',
]);
```

**Returns a [Webhook Endpoint](#webhook-endpoint-resource) resource.**

**Example Response:**

```json
{
    "id": "wh_xxxxx",
    "resource": "webhook",
    "secret_key": "whsk_xxxxx",
    "status": "enabled",
    "description": "Production order fulfillment webhook",
    "livemode": false,
    "url": "https://example.com/webhooks/updated",
    "events": [
        "payment_intent.succeeded",
        "refund.created"
    ],
    "created_at": 1706056262,
    "updated_at": 1706056600
}
```

## Delete a Webhook Endpoint

```php
Payrex::webhooks()->delete('wh_xxxxx');
```

**Returns a [Deleted Resource](/api/deleted-resource).**

**Example Response:**

```json
{
    "id": "wh_xxxxx",
    "resource": "webhook",
    "deleted": true
}
```

## Enable a Webhook Endpoint

```php
use LegionHQ\LaravelPayrex\Enums\WebhookEndpointStatus;

$webhook = Payrex::webhooks()->enable('wh_xxxxx');

echo $webhook->status; // WebhookEndpointStatus::Enabled
```

**Returns a [Webhook Endpoint](#webhook-endpoint-resource) resource.**

## Disable a Webhook Endpoint

```php
use LegionHQ\LaravelPayrex\Enums\WebhookEndpointStatus;

$webhook = Payrex::webhooks()->disable('wh_xxxxx');

echo $webhook->status; // WebhookEndpointStatus::Disabled
```

**Returns a [Webhook Endpoint](#webhook-endpoint-resource) resource.**

**Example Response:**

```json
{
    "id": "wh_xxxxx",
    "resource": "webhook",
    "secret_key": "whsk_xxxxx",
    "status": "disabled",
    "description": "This is the webhook used for sending shipments after receiving successfully paid payments",
    "livemode": false,
    "url": "https://example.com/webhooks/shipments",
    "events": [
        "payment_intent.succeeded"
    ],
    "created_at": 1706056262,
    "updated_at": 1706056500
}
```

## Webhook Endpoint Resource

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (`wh_` prefix) |
| `resource` | string | Always `webhook`. Note: the PayRex API returns `"webhook"` as the resource type, while the package uses `WebhookEndpoint` as the DTO class name to avoid confusion with webhook events. |
| `secret_key` | string | Secret for webhook signature verification (`whsk_` prefix) |
| `url` | string | HTTPS endpoint receiving events |
| `events` | array | Event types the webhook monitors |
| `description` | string\|null | Reference text |
| `status` | string | See [WebhookEndpointStatus](/guide/enums#webhookendpointstatus) |
| `livemode` | boolean | Live or test mode |
| `created_at` | integer | Unix timestamp |
| `updated_at` | integer | Unix timestamp |

::: tip Property Access
Response field names above are shown in `snake_case` (matching the raw API response). In PHP, access them as **camelCase** typed properties on the DTO — e.g., `secret_key` becomes `$webhook->secretKey`. See [Response Data](/guide/response-data) for details.
:::

## Further Reading

- [Webhook Handling](/guide/webhooks) — Set up event listeners for incoming webhooks
- [Artisan Commands](/guide/artisan-commands) — Manage webhook endpoints via CLI
- [Configuration — Webhook Settings](/guide/configuration#webhook-configuration) — Webhook path, secret, and tolerance
