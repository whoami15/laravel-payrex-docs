---
title: Test Cards
description: Test card numbers for PayRex test mode - Visa, Mastercard, decline scenarios, insufficient funds, and 3D Secure authentication.
---

# Test Cards

PayRex provides test card numbers for simulating various payment scenarios in test mode. Use any valid future expiration date (e.g., `12/34`) and any three-digit CVC (e.g., `123`).

## Successful Payments

| Card Number | Brand | Type |
|---|---|---|
| `4242424242424242` | Visa | Credit |
| `4701322211111234` | Visa | Debit |
| `5425233430109903` | Mastercard | Credit |
| `5200828282828210` | Mastercard | Debit |

## By Country

| Card Number | Country |
|---|---|
| `4242424242424242` | US |
| `4000000760000002` | PH (Philippines) |

## Failure Scenarios

Use these cards to test your [error handling](/guide/error-handling). The `failed_code` value appears in the `last_payment_error` attribute of the Payment Intent (see [Debugging Failed Payments](/guide/error-handling#debugging-failed-payments)).

| Card Number | Scenario | `failed_code` |
|---|---|---|
| `4000000000001000` | Fraudulent transaction error | `blocked` |
| `4005550000000019` | Generic decline error | `generic_decline` |
| `4503300000000008` | Insufficient fund error | `funds_insufficient` |
| `4205260000000005` | Incorrect CVC | `cvc_incorrect` |
| `4001270000000000` | Processing error | `processing_error` |
| `4012000033330026` | System error | `system_error` |

## 3D Secure Scenarios

| Card Number | Scenario | `failed_code` |
|---|---|---|
| `4311780000241409` | Frictionless authentication (succeeds without challenge) | not applicable |
| `4000000000000077` | Declined frictionless authentication | `generic_decline` |

::: info
Test card numbers only work in test mode. They cannot be used for real payments. For more details, see the [PayRex Testing documentation](https://docs.payrex.com/docs/guide/developer_handbook/testing/testing_your_integration).
:::

## Further Reading

- [Accept a Payment](/guide/accept-a-payment) — Standard payment flow
- [Hold then Capture](/guide/hold-then-capture) — Authorize and capture card payments
- [Error Handling](/guide/error-handling) — Handle failed payments
- [Testing](/guide/testing) — Test your integration with `Http::fake()`
