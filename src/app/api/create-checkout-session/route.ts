import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-09-30.acacia", // Using the latest API version
});

// Define the type for items in the request body
interface Item {
  title: string;
  price: number;
  description: string;
  image: string;
}

// POST handler for creating a checkout session
export async function POST(req: NextRequest) {
  try {
    const { items, email }: { items: Item[]; email: string } = await req.json();

    // Transform items into the required Stripe format
    const transformedItems = items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.title,
          images: [item.image],
        },
        unit_amount: item.price * 100, // Convert to the smallest unit (e.g., paise)
      },
      quantity: 1,
    }));

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      shipping_address_collection: { allowed_countries: ["IN"] },
      line_items: transformedItems,
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
      metadata: {
        email,
        images: JSON.stringify(items.map((item) => item.image)),
      },
    });

    // Return the session ID as a response
    return NextResponse.json({ id: session.id }, { status: 200 });
  } catch (error) {
    console.error("Internal Server Error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
