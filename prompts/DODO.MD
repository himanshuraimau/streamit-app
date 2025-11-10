# TypeScript

> Integrate Dodo Payments into your TypeScript and Node.js applications with type safety and modern async/await support

The TypeScript SDK provides convenient server-side access to the Dodo Payments REST API for TypeScript and JavaScript applications. It features comprehensive type definitions, error handling, retries, timeouts, and auto-pagination for seamless payment processing.

## Installation

Install the SDK using your package manager of choice:

<CodeGroup>
  ```bash npm theme={null}
  npm install dodopayments
  ```

  ```bash yarn theme={null}
  yarn add dodopayments
  ```

  ```bash pnpm theme={null}
  pnpm add dodopayments
  ```
</CodeGroup>

## Quick Start

Initialize the client with your API key and start processing payments:

```javascript  theme={null}
import DodoPayments from 'dodopayments';

const client = new DodoPayments({
  bearerToken: process.env['DODO_PAYMENTS_API_KEY'], // This is the default and can be omitted
  environment: 'test_mode', // defaults to 'live_mode'
});

const checkoutSessionResponse = await client.checkoutSessions.create({
  product_cart: [{ product_id: 'product_id', quantity: 1 }],
});

console.log(checkoutSessionResponse.session_id);
```

<Warning>
  Always store your API keys securely using environment variables. Never commit them to version control or expose them in client-side code.
</Warning>

## Core Features

<CardGroup cols={2}>
  <Card title="TypeScript First" icon="shield-check">
    Full TypeScript support with comprehensive type definitions for all API endpoints
  </Card>

  <Card title="Auto-Pagination" icon="arrows-rotate">
    Automatic pagination for list responses makes working with large datasets effortless
  </Card>

  <Card title="Error Handling" icon="triangle-exclamation">
    Built-in error types with detailed messages for different failure scenarios
  </Card>

  <Card title="Smart Retries" icon="repeat">
    Configurable automatic retries with exponential backoff for transient errors
  </Card>
</CardGroup>

## Configuration

### Environment Variables

Set environment variables for secure configuration:

```bash .env theme={null}
DODO_PAYMENTS_API_KEY=your_api_key_here
```

### Timeout Configuration

Configure request timeouts globally or per-request:

```typescript  theme={null}
// Configure default timeout for all requests (default is 1 minute)
const client = new DodoPayments({
  timeout: 20 * 1000, // 20 seconds
});

// Override per-request
await client.checkoutSessions.create(
  { product_cart: [{ product_id: 'product_id', quantity: 0 }] },
  { timeout: 5 * 1000 }
);
```

### Retry Configuration

Configure automatic retry behavior:

```javascript  theme={null}
// Configure default for all requests (default is 2 retries)
const client = new DodoPayments({
  maxRetries: 0, // disable retries
});

// Override per-request
await client.checkoutSessions.create(
  { product_cart: [{ product_id: 'product_id', quantity: 0 }] },
  { maxRetries: 5 }
);
```

<Tip>
  The SDK automatically retries requests that fail due to network errors or server issues (5xx responses) with exponential backoff.
</Tip>

## Common Operations

### Create a Checkout Session

Generate a checkout session for collecting payment information:

```typescript  theme={null}
const session = await client.checkoutSessions.create({
  product_cart: [
    {
      product_id: 'prod_123',
      quantity: 1
    }
  ],
  return_url: 'https://yourdomain.com/return'
});

console.log('Redirect to:', session.url);
```

### Manage Customers

Create and retrieve customer information:

```typescript  theme={null}
// Create a customer
const customer = await client.customers.create({
  email: 'customer@example.com',
  name: 'John Doe',
  metadata: {
    user_id: '12345'
  }
});

// Retrieve customer
const retrieved = await client.customers.retrieve('cus_123');
console.log(`Customer: ${retrieved.name} (${retrieved.email})`);
```

### Handle Subscriptions

Create and manage recurring subscriptions:

```typescript  theme={null}
// Create a subscription
const subscription = await client.subscriptions.create({
  customer_id: 'cus_123',
  product_id: 'prod_456',
  price_id: 'price_789'
});

// Retrieve subscription usage history
const usageHistory = await client.subscriptions.retrieveUsageHistory('sub_123', {
  start_date: '2024-01-01T00:00:00Z',
  end_date: '2024-03-31T23:59:59Z'
});
```

## Usage-Based Billing

### Ingest Usage Events

Track custom events for usage-based billing:

```typescript  theme={null}
await client.usageEvents.ingest({
  events: [
    {
      event_id: 'api_call_12345',
      customer_id: 'cus_abc123',
      event_name: 'api_request',
      timestamp: '2024-01-15T10:30:00Z',
      metadata: {
        endpoint: '/api/v1/users',
        method: 'GET',
        tokens_used: '150'
      }
    }
  ]
});
```

<Info>
  Events must have unique `event_id` values for idempotency. Duplicate IDs within the same request are rejected, and subsequent requests with existing IDs are ignored.
</Info>

### Retrieve Usage Events

Fetch detailed information about usage events:

```typescript  theme={null}
// Get a specific event
const event = await client.usageEvents.retrieve('api_call_12345');

// List events with filtering
const events = await client.usageEvents.list({
  customer_id: 'cus_abc123',
  event_name: 'api_request',
  start: '2024-01-14T10:30:00Z',
  end: '2024-01-15T10:30:00Z'
});
```

## Proxy Configuration

Configure proxy settings for different runtimes:

### Node.js (using undici)

```typescript  theme={null}
import DodoPayments from 'dodopayments';
import * as undici from 'undici';

const proxyAgent = new undici.ProxyAgent('http://localhost:8888');
const client = new DodoPayments({
  fetchOptions: {
    dispatcher: proxyAgent,
  },
});
```

### Bun

```typescript  theme={null}
import DodoPayments from 'dodopayments';

const client = new DodoPayments({
  fetchOptions: {
    proxy: 'http://localhost:8888',
  },
});
```

### Deno

```typescript  theme={null}
import DodoPayments from 'npm:dodopayments';

const httpClient = Deno.createHttpClient({ proxy: { url: 'http://localhost:8888' } });
const client = new DodoPayments({
  fetchOptions: {
    client: httpClient,
  },
});
```

## Logging

Control log verbosity using environment variables or client options:

```typescript  theme={null}
// Via client option
const client = new DodoPayments({
  logLevel: 'debug', // Show all log messages
});
```

```bash  theme={null}
# Via environment variable
export DODO_PAYMENTS_LOG=debug
```

**Available log levels:**

* `'debug'` - Show debug messages, info, warnings, and errors
* `'info'` - Show info messages, warnings, and errors
* `'warn'` - Show warnings and errors (default)
* `'error'` - Show only errors
* `'off'` - Disable all logging

<Warning>
  At the debug level, all HTTP requests and responses are logged, including headers and bodies. Some authentication headers are redacted, but sensitive data in bodies may still be visible.
</Warning>

## Migration from Node.js SDK

If you're upgrading from the legacy Node.js SDK, the TypeScript SDK offers improved type safety and features:

<Card title="View Migration Guide" icon="arrow-right" href="https://github.com/dodopayments/dodopayments-typescript/blob/main/MIGRATION.md">
  Learn how to migrate from the Node.js SDK to the TypeScript SDK
</Card>

## Resources

<CardGroup cols={2}>
  <Card title="GitHub Repository" icon="github" href="https://github.com/dodopayments/dodopayments-typescript">
    View source code and contribute
  </Card>

  <Card title="API Reference" icon="book" href="/api-reference/introduction">
    Complete API documentation
  </Card>

  <Card title="Discord Community" icon="discord" href="https://discord.gg/bYqAp4ayYh">
    Get help and connect with developers
  </Card>

  <Card title="Report Issues" icon="bug" href="https://github.com/dodopayments/dodopayments-typescript/issues">
    Report bugs or request features
  </Card>
</CardGroup>

## Support

Need help with the TypeScript SDK?

* **Discord**: Join our [community server](https://discord.gg/bYqAp4ayYh) for real-time support
* **Email**: Contact us at [support@dodopayments.com](mailto:support@dodopayments.com)
* **GitHub**: Open an issue on the [repository](https://github.com/dodopayments/dodopayments-typescript)

## Contributing

We welcome contributions! Check the [contributing guidelines](https://github.com/dodopayments/dodopayments-typescript/blob/main/CONTRIBUTING.md) to get started.




# One-time Payments Integration Guide

> This guide will help you integrate the Dodo Payments API into your website.

## Prerequisites

To integrate the Dodo Payments API, you'll need:

* A Dodo Payments merchant account
* API Credentials (API key and webhook secret key) from dashboard

## Dashboard Setup

1. Navigate to the [Dodo Payments Dashboard](https://app.dodopayments.com/)

2. Create a product (one-time payment or subscription)

3. Generate your API key:
   * Go to Developer > API
   * [Detailed Guide](/api-reference/introduction#api-key-generation)
   * Copy the API key the in env named DODO\_PAYMENTS\_API\_KEY

4. Configure webhooks:
   * Go to Developer > Webhooks
   * Create a webhook URL for payment notifications
   * Copy the webhook secret key in env

## Integration

### Payment Links

Choose the integration path that fits your use case:

* **Checkout Sessions (recommended)**: Best for most integrations. Create a session on your server and redirect customers to a secure, hosted checkout.
* **Overlay Checkout (embedded)**: Use when you need an in-page experience that embeds the hosted checkout on your site.
* **Static Payment Links**: No-code, instantly shareable URLs for quick payment collection.
* **Dynamic Payment Links**: Programmatically created links. However, Checkout Sessions are recommended and provide more flexibility.

#### 1. Checkout Sessions

Use Checkout Sessions to create a secure, hosted checkout experience for one-time payments or subscriptions. You create a session on your server, then redirect the customer to the returned `checkout_url`.

<Info>
  Checkout sessions are valid for 24 hours by default. If you pass <code>confirm=true</code>, sessions are valid for 15 minutes and all required fields must be provided.
</Info>

<Steps>
  <Step title="Create a checkout session">
    Choose your preferred SDK or call the REST API.

    <Tabs>
      <Tab title="Node.js SDK">
        ```javascript  theme={null}
        import DodoPayments from 'dodopayments';

        const client = new DodoPayments({
          bearerToken: process.env.DODO_PAYMENTS_API_KEY,
        });

        const session = await client.checkoutSessions.create({
          product_cart: [{ product_id: 'prod_123', quantity: 1 }],
          customer: { email: 'customer@example.com', name: 'John Doe' },
          return_url: 'https://yourapp.com/checkout/success',
        });
        ```
      </Tab>

      <Tab title="Python SDK">
        ```python  theme={null}
        import os
        from dodopayments import DodoPayments

        client = DodoPayments(bearer_token=os.environ.get("DODO_PAYMENTS_API_KEY"))

        session = client.checkout_sessions.create(
            product_cart=[{"product_id": "prod_123", "quantity": 1}],
            customer={"email": "customer@example.com", "name": "John Doe"},
            return_url="https://yourapp.com/checkout/success",
        )
        ```
      </Tab>

      <Tab title="REST API">
        ```javascript  theme={null}
        const response = await fetch('https://test.dodopayments.com/checkouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
          },
          body: JSON.stringify({
            product_cart: [{ product_id: 'prod_123', quantity: 1 }],
            customer: { email: 'customer@example.com', name: 'John Doe' },
            return_url: 'https://yourapp.com/checkout/success',
          }),
        });
        const session = await response.json();
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Redirect customer to checkout">
    After session creation, redirect to the `checkout_url` to start the hosted flow.

    ```javascript  theme={null}
    // Example in a browser context
    window.location.href = session.checkout_url;
    ```
  </Step>
</Steps>

<Tip>
  Prefer Checkout Sessions for the fastest, most reliable way to start taking payments. For advanced customization, see the full <a href="/developer-resources/checkout-session">Checkout Sessions guide</a> and the <a href="/api-reference/checkout-sessions/create">API Reference</a>.
</Tip>

#### 2. Overlay Checkout

For a seamless in-page checkout experience, explore our [Overlay Checkout](/developer-resources/overlay-checkout) integration that allows customers to complete payments without leaving your website.

#### 3. Static Payment Links

Static payment links let you quickly accept payments by sharing a simple URL. You can customize the checkout experience by passing query parameters to pre-fill customer details, control form fields, and add custom metadata.

<Steps>
  <Step title="Construct your payment link">
    Start with the base URL and append your product ID:

    ```text  theme={null}
    https://checkout.dodopayments.com/buy/{productid}
    ```
  </Step>

  <Step title="Add core parameters">
    Include essential query parameters:

    * <ParamField query="quantity" type="integer" default="1">Number of items to purchase.</ParamField>
    * <ParamField query="redirect_url" type="string" required>URL to redirect after payment completion.</ParamField>

    <Note>
      The redirect URL will include payment details as query parameters, for example:<br />
      <code>[https://example.com/?payment\_id=pay\_ts2ySpzg07phGeBZqePbH\&status=succeeded](https://example.com/?payment_id=pay_ts2ySpzg07phGeBZqePbH\&status=succeeded)</code>
    </Note>
  </Step>

  <Step title="Pre-fill customer information (optional)">
    Add customer or billing fields as query parameters to streamline checkout.

    <AccordionGroup>
      <Accordion title="Supported Customer Fields">
        * <ParamField query="fullName" type="string">Customer's full name (ignored if firstName or lastName is provided).</ParamField>
        * <ParamField query="firstName" type="string">Customer's first name.</ParamField>
        * <ParamField query="lastName" type="string">Customer's last name.</ParamField>
        * <ParamField query="email" type="string">Customer's email address.</ParamField>
        * <ParamField query="country" type="string">Customer's country.</ParamField>
        * <ParamField query="addressLine" type="string">Street address.</ParamField>
        * <ParamField query="city" type="string">City.</ParamField>
        * <ParamField query="state" type="string">State or province.</ParamField>
        * <ParamField query="zipCode" type="string">Postal/ZIP code.</ParamField>
        * <ParamField query="showDiscounts" type="boolean">true or false</ParamField>
      </Accordion>
    </AccordionGroup>
  </Step>

  <Step title="Control form fields (optional)">
    <Info>
      You can disable specific fields to make them read-only for the customer. This is useful when you already have the customer's details (e.g., logged-in users).
    </Info>

    To disable a field, provide its value and set the corresponding <code>disable...</code> flag to <code>true</code>:

    <CodeGroup>
      ```text Example theme={null}
      &email=alice@example.com&disableEmail=true
      ```
    </CodeGroup>

    <Tabs>
      <Tab title="Disable Flags Table">
        | Field        | Disable Flag         | Required Parameter |
        | ------------ | -------------------- | ------------------ |
        | Full Name    | `disableFullName`    | `fullName`         |
        | First Name   | `disableFirstName`   | `firstName`        |
        | Last Name    | `disableLastName`    | `lastName`         |
        | Email        | `disableEmail`       | `email`            |
        | Country      | `disableCountry`     | `country`          |
        | Address Line | `disableAddressLine` | `addressLine`      |
        | City         | `disableCity`        | `city`             |
        | State        | `disableState`       | `state`            |
        | ZIP Code     | `disableZipCode`     | `zipCode`          |
      </Tab>
    </Tabs>

    <Tip>
      Disabling fields helps prevent accidental changes and ensures data consistency.
    </Tip>

    <Note>
      Setting <code>showDiscounts=false</code> will disable and hide the discounts section in the checkout form. Use this if you want to prevent customers from entering coupon or promo codes during checkout.
    </Note>
  </Step>

  <Step title="Add advanced controls (optional)">
    * <ParamField query="paymentCurrency" type="string">Specifies the payment currency. Defaults to the billing country's currency.</ParamField>
    * <ParamField query="showCurrencySelector" type="boolean" default="true">Show or hide the currency selector.</ParamField>
    * <ParamField query="paymentAmount" type="integer">Amount in cents (for Pay What You Want pricing only).</ParamField>
    * <ParamField query="metadata_*" type="string">Custom metadata fields (e.g., <code>metadata\_orderId=123</code>).</ParamField>
  </Step>

  <Step title="Share the link">
    Send the completed payment link to your customer. When they visit, all query parameters are collected and stored with a session ID. The URL is then simplified to include just the session parameter (e.g., <code>?session=sess\_1a2b3c4d</code>). The stored information persists through page refreshes and is accessible throughout the checkout process.

    <Check>
      The customer's checkout experience is now streamlined and personalized based on your parameters.
    </Check>
  </Step>
</Steps>

#### 4. Dynamic Payment Links

<Tip>
  Prefer Checkout Sessions for most use cases, they offer more flexibility and control.
</Tip>

Created via API call or our SDK with customer details. Here's an example:

There are two APIs for creating dynamic payment links:

* One-time Payment Link API [API reference](/api-reference/payments/post-payments)
* Subscription Payment Link API [API reference](/api-reference/subscriptions/post-subscriptions)

The guide below is for one-time payment link creation.

For detailed instructions on integrating subscriptions, refer to this [Subscription Integration Guide](/developer-resources/subscription-integration-guide).

<Info>Make sure you are passing `payment_link = true` to get payment link </Info>

<Tabs>
  <Tab title="Node.js SDK">
    ```javascript  theme={null}
    import DodoPayments from 'dodopayments';

    const client = new DodoPayments({
    bearerToken: process.env['DODO_PAYMENTS_API_KEY'], // This is the default and can be omitted
    });

    async function main() {
    const payment = await client.payments.create({
    payment_link: true,
    billing: { city: 'city', country: 'AF', state: 'state', street: 'street', zipcode: 0 },
    customer: { email: 'email@email.com', name: 'name' },
    product_cart: [{ product_id: 'product_id', quantity: 0 }],
    });

    console.log(payment.payment_id);
    }

    main();
    ```
  </Tab>

  <Tab title="Python SDK">
    ```python  theme={null}
    import os
    from dodopayments import DodoPayments

    client = DodoPayments(
    bearer_token=os.environ.get("DODO_PAYMENTS_API_KEY"),  # This is the default and can be omitted (if using same name `DODO_PAYMENTS_API_KEY`)
    )
    payment = client.payments.create(
    payment_link=True,
    billing={
        "city": "city",
        "country": "AF",
        "state": "state",
        "street": "street",
        "zipcode": 0,
    },
    customer={
        "email": "email@email.com",
        "name": "name",
    },
    product_cart=[{
        "product_id": "product_id",
        "quantity": 0,
    }],
    )
    print(payment.payment_link)
    ```
  </Tab>

  <Tab title="Go SDK">
    ```go  theme={null}
    package main

    import (
    "context"
    "fmt"

    "github.com/dodopayments/dodopayments-go"
    "github.com/dodopayments/dodopayments-go/option"
    )

    func main() {
    client := dodopayments.NewClient(
    option.WithBearerToken("My Bearer Token"), // defaults to os.LookupEnv("DODO_PAYMENTS_API_KEY")
    )
    payment, err := client.Payments.New(context.TODO(), dodopayments.PaymentNewParams{
    PaymentLink: dodopayments.F(true),
    Billing: dodopayments.F(dodopayments.PaymentNewParamsBilling{
      City: dodopayments.F("city"),
      Country: dodopayments.F(dodopayments.CountryCodeAf),
      State: dodopayments.F("state"),
      Street: dodopayments.F("street"),
      Zipcode: dodopayments.F(int64(0)),
    }),
    Customer: dodopayments.F(dodopayments.PaymentNewParamsCustomer{
      Email: dodopayments.F("email"),
      Name: dodopayments.F("name"),
    }),
    ProductCart: dodopayments.F([]dodopayments.PaymentNewParamsProductCart{dodopayments.PaymentNewParamsProductCart{
      ProductID: dodopayments.F("product_id"),
      Quantity: dodopayments.F(int64(0)),
    }}),
    })
    if err != nil {
    panic(err.Error())
    }
    fmt.Printf("%+v\n", payment.PaymentLink)
    }

    ```
  </Tab>

  <Tab title="Api Reference">
    ```javascript  theme={null}
    import { NextRequest, NextResponse } from "next/server";      

    export async function POST(request: NextRequest) {
    try {
    const body = await request.json();
    const { formData, cartItems } = paymentRequestSchema.parse(body);

    const response = await fetch(`${process.env.NEXT_PUBLIC_DODO_TEST_API}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DODO_API_KEY}`, // Replace with your API secret key generated from the Dodo Payments Dashboard
      },
      body: JSON.stringify({
        billing: {
          city: formData.city,
          country: formData.country,
          state: formData.state,
          street: formData.addressLine,
          zipcode: parseInt(formData.zipCode),
        },
        customer: {
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          phone_number: formData.phoneNumber || undefined,
        },
        payment_link: true,
        product_cart: cartItems.map((id) => ({
          product_id: id,
          quantity: 1,
        })),
        return_url: process.env.NEXT_PUBLIC_RETURN_URL,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { error: "Payment link creation failed", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ paymentLink: data.payment_link });
    } catch (err) {
    console.error("Payment error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "An unknown error occurred",
      },
      { status: 500 }
    );
    }
    }
    ```
  </Tab>
</Tabs>

<Info>After creating the payment link, redirect your customers to complete their payment.</Info>

### Implementing Webhooks

Set up an API endpoint to receive payment notifications. Here's an example using Next.js:

```javascript  theme={null}
import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";
import { WebhookPayload } from "@/types/api-types";

const webhook = new Webhook(process.env.DODO_WEBHOOK_KEY!); // Replace with your secret key generated from the Dodo Payments Dashboard

export async function POST(request: Request) {
  const headersList = headers();
  const rawBody = await request.text();

  const webhookHeaders = {
    "webhook-id": headersList.get("webhook-id") || "",
    "webhook-signature": headersList.get("webhook-signature") || "",
    "webhook-timestamp": headersList.get("webhook-timestamp") || "",
  };

  await webhook.verify(rawBody, webhookHeaders);
  const payload = JSON.parse(rawBody) as WebhookPayload;
  
  // Process the payload according to your business logic
}
```

Our webhook implementation follows the [Standard Webhooks](https://standardwebhooks.com/) specification. For webhook type definitions, refer to our [Webhook Event Guide](/developer-resources/webhooks/intents/webhook-events-guide).

You can refer to this project with demo implementation on [GitHub](https://github.com/dodopayments/dodo-checkout-demo) using Next.js and TypeScript.

You can check out the live implementation [here](https://atlas.dodopayments.com/).
