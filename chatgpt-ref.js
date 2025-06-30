const express = require('express');
const app = express();
app.use(express.json()); // For parsing JSON bodies

const stripe = require('stripe')('sk_test_YourSecretKeyHere'); // Replace with your Stripe secret key

// 1. Create a checkout session with your line items
app.post('/create-checkout-session', async (req, res) => {
  try {
    // Example: get fees and penalty from request or set fixed values
    const fees = 5000;      // e.g. Rs. 5000
    const penalty = 1000;   // e.g. Rs. 1000

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Tuition Fees',
            },
            unit_amount: fees * 100, // amount in paise
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Penalty',
            },
            unit_amount: penalty * 100,
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/payment-cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to create checkout session');
  }
});

// 2. Endpoint to retrieve session info + line items after payment success
app.get('/payment-success', async (req, res) => {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.status(400).send('Session ID missing');
  }

  try {
    // Retrieve the Checkout Session details
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Retrieve all line items associated with this session
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
      expand: ['data.price.product'], // Optional: expand product details
    });

    // You can log or process the info here
    console.log('Session:', session);
    console.log('Line Items:', lineItems.data);

    // Send response back (you can format as you want)
    res.json({
      payment_status: session.payment_status,
      customer_email: session.customer_email,
      line_items: lineItems.data.map(item => ({
        description: item.description,
        quantity: item.quantity,
        amount: item.price.unit_amount / 100, // convert paise back to rupees
        currency: item.price.currency,
        product_name: item.price.product.name,
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to retrieve payment info');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
