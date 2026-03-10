---
title: Enums
description: All PHP string-backed enums - PaymentIntentStatus, PaymentMethod, RefundReason, BillingStatementStatus, WebhookEventType, and more.
---

# Enums

The package provides PHP string-backed enums for all PayRex constants. Use them for type safety, autocompletion, and to avoid hard-coding string values.

All enums are in the `LegionHQ\LaravelPayrex\Enums` namespace.

## Using Enums

Pass enum values in API calls using the `->value` property:

```php
use LegionHQ\LaravelPayrex\Enums\PaymentMethod;
use LegionHQ\LaravelPayrex\Enums\RefundReason;
use LegionHQ\LaravelPayrex\Facades\Payrex;

$paymentIntent = Payrex::paymentIntents()->create([
    'amount' => 10000,
    'payment_methods' => [
        PaymentMethod::Card->value, // [!code focus:2]
        PaymentMethod::GCash->value,
    ],
]);

$refund = Payrex::refunds()->create([
    'payment_id' => 'pay_xxxxx',
    'amount' => 5000,
    'reason' => RefundReason::RequestedByCustomer->value, // [!code focus]
]);
```

Typed properties return enum instances, so you can compare directly:

```php
use LegionHQ\LaravelPayrex\Enums\PaymentIntentStatus;

$paymentIntent = Payrex::paymentIntents()->retrieve('pi_xxxxx');

// Typed property returns the enum instance
if ($paymentIntent->status === PaymentIntentStatus::Succeeded) { // [!code focus:3]
    // Payment completed
}

// Array access returns the raw string — compare with ->value
if ($paymentIntent['status'] === PaymentIntentStatus::Succeeded->value) {
    // Also works
}

// Use match for branching logic
match ($paymentIntent->status) { // [!code focus:6]
    PaymentIntentStatus::Succeeded => $this->fulfillOrder($paymentIntent),
    PaymentIntentStatus::AwaitingCapture => $this->reserveInventory($paymentIntent),
    PaymentIntentStatus::Canceled => $this->cancelOrder($paymentIntent),
    default => null,
};
```

## PaymentMethod

Available payment methods accepted by PayRex.

```php
use LegionHQ\LaravelPayrex\Enums\PaymentMethod;

PaymentMethod::Card;           // 'card'
PaymentMethod::GCash;          // 'gcash'
PaymentMethod::Maya;           // 'maya'
PaymentMethod::BillEase;       // 'billease'
PaymentMethod::QrPh;           // 'qrph'
PaymentMethod::BdoInstallment; // 'bdo_installment'
```

## PaymentIntentStatus

Lifecycle states of a payment intent.

```php
use LegionHQ\LaravelPayrex\Enums\PaymentIntentStatus;

PaymentIntentStatus::AwaitingPaymentMethod; // 'awaiting_payment_method'
PaymentIntentStatus::AwaitingNextAction;    // 'awaiting_next_action'
PaymentIntentStatus::AwaitingCapture;       // 'awaiting_capture'
PaymentIntentStatus::Processing;            // 'processing'
PaymentIntentStatus::Succeeded;             // 'succeeded'
PaymentIntentStatus::Canceled;              // 'canceled'
```

## PaymentStatus

Outcome of a payment attempt.

```php
use LegionHQ\LaravelPayrex\Enums\PaymentStatus;

PaymentStatus::Paid;   // 'paid'
PaymentStatus::Failed; // 'failed'
```

## CheckoutSessionStatus

States of a checkout session.

```php
use LegionHQ\LaravelPayrex\Enums\CheckoutSessionStatus;

CheckoutSessionStatus::Active;    // 'active'
CheckoutSessionStatus::Completed; // 'completed'
CheckoutSessionStatus::Expired;   // 'expired'
```

## RefundStatus

States of a refund.

```php
use LegionHQ\LaravelPayrex\Enums\RefundStatus;

RefundStatus::Succeeded; // 'succeeded'
RefundStatus::Failed;    // 'failed'
RefundStatus::Pending;   // 'pending'
```

## RefundReason

Reasons for issuing a refund. Required when creating a refund.

```php
use LegionHQ\LaravelPayrex\Enums\RefundReason;

RefundReason::Fraudulent;           // 'fraudulent'
RefundReason::RequestedByCustomer;  // 'requested_by_customer'
RefundReason::ProductOutOfStock;    // 'product_out_of_stock'
RefundReason::ServiceNotProvided;   // 'service_not_provided'
RefundReason::ProductWasDamaged;    // 'product_was_damaged'
RefundReason::ServiceMisaligned;    // 'service_misaligned'
RefundReason::WrongProductReceived; // 'wrong_product_received'
RefundReason::Others;               // 'others'
```

## BillingStatementStatus

Lifecycle states of a billing statement.

```php
use LegionHQ\LaravelPayrex\Enums\BillingStatementStatus;

BillingStatementStatus::Draft;         // 'draft'
BillingStatementStatus::Open;          // 'open'
BillingStatementStatus::Paid;          // 'paid'
BillingStatementStatus::Void;          // 'void'
BillingStatementStatus::Uncollectible; // 'uncollectible'
BillingStatementStatus::Overdue;       // 'overdue'
```

## PayoutStatus

States of a payout to your bank account.

```php
use LegionHQ\LaravelPayrex\Enums\PayoutStatus;

PayoutStatus::Pending;    // 'pending'
PayoutStatus::InTransit;  // 'in_transit'
PayoutStatus::Failed;     // 'failed'
PayoutStatus::Successful; // 'successful'
```

## PayoutTransactionType

Type of transaction within a payout.

```php
use LegionHQ\LaravelPayrex\Enums\PayoutTransactionType;

PayoutTransactionType::Payment;    // 'payment'
PayoutTransactionType::Refund;     // 'refund'
PayoutTransactionType::Adjustment; // 'adjustment'
```

## WebhookEndpointStatus

Status of a webhook endpoint.

```php
use LegionHQ\LaravelPayrex\Enums\WebhookEndpointStatus;

WebhookEndpointStatus::Enabled;  // 'enabled'
WebhookEndpointStatus::Disabled; // 'disabled'
```

## WebhookEventType

All event types that PayRex can send to your webhook endpoint.

```php
use LegionHQ\LaravelPayrex\Enums\WebhookEventType;

// Payment events
WebhookEventType::PaymentIntentSucceeded;       // 'payment_intent.succeeded'
WebhookEventType::PaymentIntentAmountCapturable; // 'payment_intent.amount_capturable'

// Cash balance events
WebhookEventType::CashBalanceFundsAvailable;    // 'cash_balance.funds_available'

// Checkout events
WebhookEventType::CheckoutSessionExpired;       // 'checkout_session.expired'

// Payout events
WebhookEventType::PayoutDeposited;              // 'payout.deposited'

// Refund events
WebhookEventType::RefundCreated;                // 'refund.created'
WebhookEventType::RefundUpdated;                // 'refund.updated'

// Billing statement events
WebhookEventType::BillingStatementCreated;             // 'billing_statement.created'
WebhookEventType::BillingStatementUpdated;             // 'billing_statement.updated'
WebhookEventType::BillingStatementDeleted;             // 'billing_statement.deleted'
WebhookEventType::BillingStatementFinalized;           // 'billing_statement.finalized'
WebhookEventType::BillingStatementSent;                // 'billing_statement.sent'
WebhookEventType::BillingStatementMarkedUncollectible; // 'billing_statement.marked_uncollectible'
WebhookEventType::BillingStatementVoided;              // 'billing_statement.voided'
WebhookEventType::BillingStatementPaid;                // 'billing_statement.paid'
WebhookEventType::BillingStatementWillBeDue;           // 'billing_statement.will_be_due'
WebhookEventType::BillingStatementOverdue;             // 'billing_statement.overdue'

// Billing statement line item events
WebhookEventType::BillingStatementLineItemCreated;     // 'billing_statement_line_item.created'
WebhookEventType::BillingStatementLineItemUpdated;     // 'billing_statement_line_item.updated'
WebhookEventType::BillingStatementLineItemDeleted;     // 'billing_statement_line_item.deleted'
```

## Further Reading

- [Payment Methods](/guide/payment-methods) — Available payment methods and features
- [Error Handling](/guide/error-handling) — Exception types and error codes
- [Webhook Handling](/guide/webhooks) — Event classes and types
