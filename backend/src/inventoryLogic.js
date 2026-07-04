function getEffectiveThreshold(product, defaultThreshold) {
  return product?.lowStockThreshold ?? defaultThreshold ?? 5;
}

function isLowStock(quantity, threshold) {
  return quantity <= (threshold ?? 5);
}

module.exports = {
  getEffectiveThreshold,
  isLowStock,
};
