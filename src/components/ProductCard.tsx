const discount = product.originalPrice
  ? Math.round((1 - product.price / product.originalPrice) * 100)
  : 0;