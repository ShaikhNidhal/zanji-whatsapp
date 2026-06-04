// src/services/shippingService.js

// Region base pricing and markup configs (approximate 20 PKR equivalent)
const ShippingConfigs = {
  PK: { baseRate: 200, markup: 20, currency: "PKR" },
  AE: { baseRate: 15, markup: 2, currency: "AED" },
  ID: { baseRate: 15000, markup: 1200, currency: "IDR" },
  GL: { baseRate: 10, markup: 0.10, currency: "USD" }
};

/**
 * Calculates localized shipping rate with markup applied based on region.
 * 
 * @param {string} countryCode ISO country code (PK, AE, ID, etc.)
 * @param {number} weightKg Package weight in kilograms
 * @returns {Object} Calculated rate details
 */
function calculateShippingRate(countryCode, weightKg = 1.0) {
  const code = (countryCode || 'PK').toUpperCase();
  const config = ShippingConfigs[code] || ShippingConfigs.GL;
  
  // Base shipping weight multiplier (e.g. +10% rate per additional kg above 1kg)
  const weightFactor = weightKg > 1 ? 1 + (weightKg - 1) * 0.1 : 1.0;
  
  const rawBase = config.baseRate * weightFactor;
  const calculatedBase = Math.round(rawBase * 100) / 100;
  const finalRate = Math.round((calculatedBase + config.markup) * 100) / 100;

  return {
    countryCode: code,
    weightKg: weightKg,
    currency: config.currency,
    baseRate: calculatedBase,
    appliedMarkup: config.markup,
    clientRate: finalRate
  };
}

module.exports = {
  calculateShippingRate
};
