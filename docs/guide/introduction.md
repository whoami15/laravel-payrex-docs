---
title: What is PayRex for Laravel?
description: An unofficial Laravel package for integrating PayRex payment gateway - cards, GCash, Maya, BillEase, QR Ph, and more.
---

# What is PayRex for Laravel?

**PayRex for Laravel** is an unofficial community package that integrates the [PayRex](https://payrex.com) payment platform into Laravel applications. It lets you accept Philippine payment methods - cards, GCash, Maya, BillEase, QR Ph, and BDO Installment - through a clean, Laravel-idiomatic API.

<div class="tip custom-block" style="padding-top: 8px">

Just want to try it out? Skip to the [Quickstart](/guide/getting-started) or see it in action with the [Live Demo](https://payrex-laravel-demo-main-89yckp.free.laravel.cloud/login).

</div>


## Why PayRex for Laravel?

PayRex is a Philippine payment gateway that gives you access to local payment methods your customers already use. This package wraps its REST API so you don't have to deal with raw HTTP calls, signature verification, or response parsing yourself.

What you get out of the box:

- **Fluent API** — Facade and dependency injection support, cursor-based pagination with Laravel's `CursorPaginator`
- **Customer management** — Link your User model to PayRex customers with a Billable Customer trait
- **Webhook handling** — HMAC-SHA256 verification, replay protection, and typed Laravel event classes
- **Billing statements** — Create one-time payment links, finalize, send via email, and track lifecycle
- **Testable** — Mock responses with `Http::fake()`, dispatch synthetic webhook events via artisan
- **Minimal setup** — Auto-discovered service provider with opt-in webhook route. Just add your API keys

## Use Cases

- **E-commerce** — Accept card and e-wallet payments at checkout
- **SaaS** — Collect subscription fees via Payment Intents or Checkout Sessions
- **Billing** — Send billing statements and track payment status

## How It Works

There are two main flows for accepting payments:

**Checkout Sessions** — Redirect to a PayRex-hosted payment page. Simplest option, no frontend work required.

**Payment Intents + PayRex Elements** — Build a custom payment UI with the PayRex JS SDK embedded in your own pages. More control, more work.

Both flows use webhooks to notify your app when a payment succeeds, fails, or changes state. See [Choosing an Integration](/guide/choosing-an-integration) for a detailed comparison.

## Relationship to PayRex

This is an **unofficial** community package. It is not affiliated with, endorsed by, or maintained by PayRex. For PayRex's official documentation and support, visit [docs.payrex.com](https://docs.payrex.com).

## Next Steps

- [Getting Started](/guide/getting-started) — Install the package and make your first API call
- [Choosing an Integration](/guide/choosing-an-integration) — Compare Checkout Sessions vs. Payment Intents + Elements
- [API Reference](/api/payment-intents) — Detailed documentation for every resource
