export const CURRENCY = "PKR";

// Matches the homepage banner ("free shipping on orders over Rs. 5,000").
// This is used for display only (cart/checkout previews); the server-side
// place_order() database function recalculates the same rule authoritatively
// when the order is actually created, so a tampered client value here can
// never change what a customer is charged.
export const FREE_DELIVERY_THRESHOLD = 5000;
export const FLAT_DELIVERY_FEE = 250;

export function calculateSubtotal(items: Array<{ price: number; quantity: number }>) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function calculateDeliveryFee(subtotal: number) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : FLAT_DELIVERY_FEE;
}

export function calculateTotal(subtotal: number, deliveryFee: number) {
  return subtotal + deliveryFee;
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
}
