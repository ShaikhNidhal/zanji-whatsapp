// src/services/payService.js

/**
 * Processes a mock webhook payload from a payment gateway (e.g., Paymob, Xendit).
 * Splits payment by deducting a 1% platform fee and crediting the remainder to the merchant.
 * 
 * @param {Object} payload Gateway webhook payload
 * @returns {Object} Structured split payment result
 */
function processSplitPayment(payload) {
  const { transaction_id, merchant_id, amount, currency, status } = payload;
  
  if (status !== 'success' && status !== 'approved') {
    return {
      success: false,
      error: `Payment transaction ${transaction_id} is in status: ${status}. No split processed.`
    };
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return {
      success: false,
      error: "Invalid transaction amount"
    };
  }

  // Calculate fees
  const feeRate = 0.01; // 1% platform fee
  const platformFee = Math.round(numericAmount * feeRate * 100) / 100;
  const merchantSettlement = Math.round((numericAmount - platformFee) * 100) / 100;

  return {
    success: true,
    transactionId: transaction_id,
    merchantId: merchant_id,
    grossAmount: numericAmount,
    currency: currency || 'PKR',
    platformFee: platformFee,
    merchantSettlement: merchantSettlement,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  processSplitPayment
};
