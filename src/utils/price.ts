export const formatPrice = (price: number, currency: 'USD' | 'UZS', exchangeRate: number = 12800) => {
  if (currency === 'UZS') {
    const uzsPrice = Math.round(price * exchangeRate);
    // Format: 124 000 so'm (using space grouping)
    return uzsPrice.toLocaleString('uz-UZ').replace(/,/g, ' ') + " so'm";
  }
  return `$${price.toFixed(2)}`;
};
