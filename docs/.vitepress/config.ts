import { defineConfig } from "vitepress";

export default defineConfig({
  title: "PayRex for Laravel",
  description:
    "An unofficial Laravel package for integrating PayRex payment platform",
  lang: "en-US",

  markdown: {
    theme: {
      dark: "material-theme-palenight",
      light: "github-light",
    },
    lineNumbers: false,
  },

  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
    },
  },

  sitemap: {
    hostname: "https://payrexlaravel.com",
  },

  head: [
    ["link", { rel: "canonical", href: "https://payrexlaravel.com" }],
    ["meta", { name: "robots", content: "index, follow" }],
    ["meta", { name: "author", content: "Daryl Legion" }],
    [
      "meta",
      {
        name: "keywords",
        content:
          "payrex, laravel, payrex php, philippines payment gateway laravel, gcash laravel, payment gateway, philippines, gcash, maya, card payments, checkout, webhooks",
      },
    ],
    [
      "meta",
      {
        name: "google-site-verification",
        content: "Jn6dpnjqp02Ac7uB_87bHBtwL1ebmt-vQP14J5GqiRA",
      },
    ],
    [
      "script",
      { type: "application/ld+json" },
      JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareSourceCode",
            "@id": "https://payrexlaravel.com/#software",
            name: "PayRex for Laravel",
            description:
              "An unofficial Laravel package for integrating PayRex payment platform - cards, GCash, Maya, BillEase, QR Ph, and more.",
            url: "https://github.com/whoami15/payrex-laravel",
            codeRepository: "https://github.com/whoami15/payrex-laravel",
            documentation: "https://payrexlaravel.com",
            programmingLanguage: "PHP",
            runtimePlatform: "PHP 8.2+",
            license: "https://opensource.org/licenses/MIT",
            author: {
              "@type": "Person",
              "@id": "https://daryllegion.com/#person",
              name: "Daryl Legion",
              url: "https://daryllegion.com",
              sameAs: [
                "https://github.com/whoami15",
                "https://x.com/Annevigoss",
              ],
            },
          },
          {
            "@type": "WebSite",
            "@id": "https://payrexlaravel.com/#website",
            url: "https://payrexlaravel.com",
            name: "PayRex for Laravel",
            description:
              "An unofficial Laravel package for integrating PayRex payment platform",
            publisher: {
              "@id": "https://daryllegion.com/#person",
            },
          },
        ],
      }),
    ],
  ],

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API Reference", link: "/api/payment-intents" },
      {
        text: "v1.x",
        items: [
          {
            text: "Changelog",
            link: "https://github.com/whoami15/payrex-laravel/releases",
          },
          {
            text: "Contributing",
            link: "https://github.com/whoami15/payrex-laravel/blob/main/CONTRIBUTING.md",
          },
        ],
      },
      {
        text: "Links",
        items: [
          {
            text: "PayRex Dashboard",
            link: "https://dashboard.payrexhq.com/signin",
          },
          {
            text: "PayRex API Docs",
            link: "https://docs.payrex.com",
          },
          {
            text: "GitHub",
            link: "https://github.com/whoami15/payrex-laravel",
          },
          {
            text: "Packagist",
            link: "https://packagist.org/packages/legionhq/laravel-payrex",
          },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          collapsed: false,
          items: [
            {
              text: "What is PayRex for Laravel?",
              link: "/guide/introduction",
            },
            {
              text: "Demo Application",
              link: "/guide/demo-application",
            },
            {
              text: "Getting Started",
              link: "/guide/getting-started",
            },
            { text: "Configuration", link: "/guide/configuration" },
          ],
        },
        {
          text: "Accepting Payments",
          collapsed: false,
          items: [
            {
              text: "Choosing an Integration",
              link: "/guide/choosing-an-integration",
            },
            {
              text: "Accept a Payment",
              link: "/guide/accept-a-payment",
            },
            {
              text: "Checkout Sessions",
              link: "/guide/checkout-sessions-guide",
            },
            {
              text: "Elements",
              link: "/guide/elements",
            },
            {
              text: "Hold then Capture",
              link: "/guide/hold-then-capture",
            },
            {
              text: "Billing Statements",
              link: "/guide/billing-statements-guide",
            },
            { text: "Refunds", link: "/guide/refunds" },
            {
              text: "Payment Methods",
              link: "/guide/payment-methods",
            },
          ],
        },
        {
          text: "Advanced",
          collapsed: false,
          items: [
            { text: "Webhook Handling", link: "/guide/webhooks" },
            {
              text: "Billable Customer",
              link: "/guide/billable-customer",
            },
            {
              text: "Error Handling",
              link: "/guide/error-handling",
            },
            { text: "Response Data", link: "/guide/response-data" },
            { text: "Pagination", link: "/guide/pagination" },
            {
              text: "Artisan Commands",
              link: "/guide/artisan-commands",
            },
            { text: "Test Cards", link: "/guide/test-cards" },
            { text: "Enums", link: "/guide/enums" },
            { text: "Testing", link: "/guide/testing" },
          ],
        },
        {
          text: "API Reference",
          items: [
            {
              text: "All Resources →",
              link: "/api/payment-intents",
            },
          ],
        },
      ],
      "/api/": [
        {
          text: "Payments",
          collapsed: false,
          items: [
            {
              text: "Payment Intents",
              link: "/api/payment-intents",
            },
            { text: "Payments", link: "/api/payments" },
            {
              text: "Checkout Sessions",
              link: "/api/checkout-sessions",
            },
            { text: "Refunds", link: "/api/refunds" },
          ],
        },
        {
          text: "Customers & Billing",
          collapsed: false,
          items: [
            { text: "Customers", link: "/api/customers" },
            {
              text: "Billing Statements",
              link: "/api/billing-statements",
            },
            {
              text: "Billing Statement Line Items",
              link: "/api/billing-statement-line-items",
            },
          ],
        },
        {
          text: "Payout Transactions",
          link: "/api/payout-transactions",
        },
        {
          text: "Webhooks",
          link: "/api/webhooks-resource",
        },
        {
          text: "Deleted Resource",
          link: "/api/deleted-resource",
        },
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/whoami15/payrex-laravel",
      },
      {
        icon: "x",
        link: "https://x.com/Annevigoss",
      },
      {
        icon: "bluesky",
        link: "https://bsky.app/profile/daryllegion.com",
      },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "An unofficial community package. Not affiliated with PayRex.",
    },

    search: {
      provider: "local",
    },

    editLink: {
      pattern:
        "https://github.com/whoami15/payrex-laravel-docs/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },

  cleanUrls: true,
  lastUpdated: true,
});
