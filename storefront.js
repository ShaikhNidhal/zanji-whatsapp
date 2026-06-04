/* ==========================================
   ZANJI CUSTOMER STOREFRONT & CHECKOUT
   ========================================== */

function initStorefront() {
  const container = document.getElementById('storefront-content');
  if (container) {
    const lang = ZanjiState.activeLanguage;
    if (lang === 'ar' || lang === 'ur') {
      container.dir = 'rtl';
      container.style.textAlign = 'right';
    } else {
      container.dir = 'ltr';
      container.style.textAlign = 'left';
    }
  }

  if (ZanjiState.customerAuthenticated) {
    renderStorefrontCatalog();
  } else {
    renderStorefrontLoginGate();
  }
}

// Handler for dynamic language swap
function changeStorefrontLanguage(lang) {
  ZanjiState.activeLanguage = lang;
  
  const container = document.getElementById('storefront-content');
  if (container) {
    if (lang === 'ar' || lang === 'ur') {
      container.dir = 'rtl';
      container.style.textAlign = 'right';
    } else {
      container.dir = 'ltr';
      container.style.textAlign = 'left';
    }
  }
  
  initStorefront();
}

// Render secure QR code sign in gate with translation switcher
function renderStorefrontLoginGate() {
  const container = document.getElementById('storefront-content');
  if (!container) return;

  const loc = StorefrontLocales[ZanjiState.activeLanguage] || StorefrontLocales.en;

  // Reusable Language switcher selector
  const langSelectorHtml = `
    <div style="display: flex; justify-content: flex-end; width: 100%; margin-bottom: 1.5rem; gap: 8px; align-items: center; direction: ltr;">
      <i data-lucide="languages" style="width: 16px; height: 16px; color: var(--text-muted);"></i>
      <select class="input-control" style="width: auto; padding: 4px 8px; font-size: 0.8rem; background: rgba(0,0,0,0.3); border-color: var(--border-color); color: var(--text-primary); cursor: pointer;" onchange="changeStorefrontLanguage(this.value)">
        <option value="en" ${ZanjiState.activeLanguage === 'en' ? 'selected' : ''}>English (EN)</option>
        <option value="ur" ${ZanjiState.activeLanguage === 'ur' ? 'selected' : ''}>اُردُو (UR)</option>
        <option value="ar" ${ZanjiState.activeLanguage === 'ar' ? 'selected' : ''}>العربية (AR)</option>
        <option value="id" ${ZanjiState.activeLanguage === 'id' ? 'selected' : ''}>Bahasa Indonesia (ID)</option>
        <option value="bn" ${ZanjiState.activeLanguage === 'bn' ? 'selected' : ''}>বাংলা (BN)</option>
        <option value="jv" ${ZanjiState.activeLanguage === 'jv' ? 'selected' : ''}>Basa Jawa (JV)</option>
        <option value="su" ${ZanjiState.activeLanguage === 'su' ? 'selected' : ''}>Basa Sunda (SU)</option>
        <option value="km" ${ZanjiState.activeLanguage === 'km' ? 'selected' : ''}>ភាសាខ្មែរ (KM)</option>
        <option value="lo" ${ZanjiState.activeLanguage === 'lo' ? 'selected' : ''}>ភាសាឡاو (LO)</option>
        <option value="my" ${ZanjiState.activeLanguage === 'my' ? 'selected' : ''}>မြန်မာဘာသာ (MY)</option>
        <option value="ne" ${ZanjiState.activeLanguage === 'ne' ? 'selected' : ''}>नेपाली (NE)</option>
        <option value="si" ${ZanjiState.activeLanguage === 'si' ? 'selected' : ''}>සිංහල (SI)</option>
        <option value="af" ${ZanjiState.activeLanguage === 'af' ? 'selected' : ''}>Afrikaans (AF)</option>
        <option value="xh" ${ZanjiState.activeLanguage === 'xh' ? 'selected' : ''}>isiXhosa (XH)</option>
        <option value="zu" ${ZanjiState.activeLanguage === 'zu' ? 'selected' : ''}>isiZulu (ZU)</option>
        <option value="yo" ${ZanjiState.activeLanguage === 'yo' ? 'selected' : ''}>Yorùbá (YO)</option>
      </select>
    </div>
  `;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1.5rem; text-align: center; gap: 1.5rem; max-width: 500px; margin: 0 auto;">
      ${langSelectorHtml}
      <div class="logo-icon" style="width: 60px; height: 60px; font-size: 1.75rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center;">Z</div>
      <div>
        <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 700; margin-bottom: 6px;">${loc.whatsapp_login}</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">${loc.login_desc}</p>
      </div>

      <!-- Visual Mock QR Code -->
      <div style="background: white; padding: 1.25rem; border-radius: 18px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; gap: 10px;">
        <div style="width: 180px; height: 180px; background: url('https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://wa.me/923001234567?text=Start_Shopping_ZariBoutique') no-repeat center; background-size: cover; border-radius: 8px;"></div>
        <div style="color: #0f172a; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 4px; direction: ltr;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--accent-primary); animation: pulse 1.5s infinite"></span>
          ${loc.scan_auth}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
        <button class="btn" style="width: 100%; justify-content: center; padding: 12px; gap: 6px;" onclick="simulateQrScan()">
          <i data-lucide="scan-line"></i> ${loc.simulate_scan}
        </button>
        <button class="btn btn-secondary" style="width: 100%; justify-content: center; padding: 12px;" onclick="bypassLoginGate()">
          ${loc.browse_guest}
        </button>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
        ${loc.scan_warning}
      </p>
    </div>
  `;
  lucide.createIcons();
}

// Simulate mobile camera scan action
function simulateQrScan() {
  alert("Simulating camera QR scan! Watch the phone simulator on the right: it starts a chat with Zari Boutique automatically.");
  
  // Triggers customer message inside WhatsApp Simulator
  appendWaMessage('customer', 'Start_Shopping_ZariBoutique');
  
  // WhatsApp bot replies with verification magic link
  setTimeout(() => {
    appendWaMessage('merchant', 
      `Salam Ayesha Ahmed! We recognized your scan token. Click the button below to enter Zari Boutique storefront logged in instantly:\n\n*Verify Session Token:*`,
      { type: 'auth_link_btn', label: 'Authenticate Storefront' }
    );
  }, 1000);
}

// Bypass login gate for guest
function bypassLoginGate() {
  ZanjiState.customerAuthenticated = true;
  renderStorefrontCatalog();
}


// Render storefront products list
function renderStorefrontCatalog() {
  const container = document.getElementById('storefront-content');
  if (!container) return;

  const currentConfig = RegionConfigs[ZanjiState.currentRegion];
  const regionNames = { PK: "Pakistan", AE: "UAE", ID: "Indonesia", NG: "Nigeria", GL: "Global / Other" };
  const loc = StorefrontLocales[ZanjiState.activeLanguage] || StorefrontLocales.en;

  // Calculate cart items count
  const cartCount = ZanjiState.cart.reduce((sum, item) => sum + item.quantity, 0);

  const langSelectorHtml = `
    <select class="input-control" style="width: auto; padding: 4px 8px; font-size: 0.8rem; background: rgba(0,0,0,0.3); border-color: var(--border-color); color: var(--text-primary); cursor: pointer;" onchange="changeStorefrontLanguage(this.value)">
      <option value="en" ${ZanjiState.activeLanguage === 'en' ? 'selected' : ''}>English (EN)</option>
      <option value="ur" ${ZanjiState.activeLanguage === 'ur' ? 'selected' : ''}>اُردُو (UR)</option>
      <option value="ar" ${ZanjiState.activeLanguage === 'ar' ? 'selected' : ''}>العربية (AR)</option>
      <option value="id" ${ZanjiState.activeLanguage === 'id' ? 'selected' : ''}>Bahasa Indonesia (ID)</option>
      <option value="bn" ${ZanjiState.activeLanguage === 'bn' ? 'selected' : ''}>বাংলা (BN)</option>
      <option value="jv" ${ZanjiState.activeLanguage === 'jv' ? 'selected' : ''}>Basa Jawa (JV)</option>
      <option value="su" ${ZanjiState.activeLanguage === 'su' ? 'selected' : ''}>Basa Sunda (SU)</option>
      <option value="km" ${ZanjiState.activeLanguage === 'km' ? 'selected' : ''}>ភាសាខ្មែរ (KM)</option>
      <option value="lo" ${ZanjiState.activeLanguage === 'lo' ? 'selected' : ''}>ភាសាឡາວ (LO)</option>
      <option value="my" ${ZanjiState.activeLanguage === 'my' ? 'selected' : ''}>မြန်မာဘာသာ (MY)</option>
      <option value="ne" ${ZanjiState.activeLanguage === 'ne' ? 'selected' : ''}>नेपाली (NE)</option>
      <option value="si" ${ZanjiState.activeLanguage === 'si' ? 'selected' : ''}>සිංහල (SI)</option>
      <option value="af" ${ZanjiState.activeLanguage === 'af' ? 'selected' : ''}>Afrikaans (AF)</option>
      <option value="xh" ${ZanjiState.activeLanguage === 'xh' ? 'selected' : ''}>isiXhosa (XH)</option>
      <option value="zu" ${ZanjiState.activeLanguage === 'zu' ? 'selected' : ''}>isiZulu (ZU)</option>
      <option value="yo" ${ZanjiState.activeLanguage === 'yo' ? 'selected' : ''}>Yorùbá (YO)</option>
    </select>
  `;

  let html = `
    <!-- Store Header -->
    <div class="store-header" style="direction: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'rtl' : 'ltr'}">
      <div class="store-info" style="text-align: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'right' : 'left'}">
        <h2>${ZanjiState.storeName}</h2>
        <p><i data-lucide="map-pin" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i> ${regionNames[ZanjiState.currentRegion]} • ${loc.delivery_note}</p>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; direction: ltr;">
        ${langSelectorHtml}
        <div class="cart-icon-btn" onclick="renderCheckoutView()">
          <i data-lucide="shopping-cart"></i>
          ${cartCount > 0 ? `<div class="cart-badge">${cartCount}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <div class="store-grid">
  `;

  ZanjiState.products.forEach(p => {
    const localPrice = Math.round(p.price * currentConfig.rate);
    html += `
      <div class="store-card" style="text-align: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'right' : 'left'}">
        <div class="store-img-container">
          <img src="${p.image}" alt="${p.title}">
        </div>
        <div class="store-body">
          <div class="store-title">${p.title}</div>
          <div class="store-desc">${p.desc}</div>
          <div class="store-footer" style="direction: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'rtl' : 'ltr'}">
            <span class="store-price">${currentConfig.symbol} ${localPrice.toLocaleString()}</span>
            <button class="btn btn-sm" onclick="addToStorefrontCart(${p.id})">
              <i data-lucide="plus"></i> ${loc.add_to_cart}
            </button>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
  lucide.createIcons();
}

// Add item to cart
function addToStorefrontCart(productId) {
  const product = ZanjiState.products.find(p => p.id === productId);
  if (!product) return;

  const existing = ZanjiState.cart.find(item => item.product.id === productId);
  if (existing) {
    existing.quantity++;
  } else {
    ZanjiState.cart.push({ product, quantity: 1 });
  }

  renderStorefrontCatalog();
}

const PaymentDetailsMap = {
  cod: { title: "Cash on Delivery (COD)", desc: "Pay when package is delivered by courier" },
  jazzcash: { title: "JazzCash Mobile Wallet", desc: "Pay via JazzCash push OTP invoice" },
  easypaisa: { title: "Easypaisa Wallet", desc: "Pay via Easypaisa OTP / USSD push" },
  stripe: { title: "Stripe Secure Checkout", desc: "Pay via global Visa/Mastercard" },
  applepay: { title: "Apple Pay Mobile", desc: "Pay instantly via Apple Wallet" },
  qris: { title: "QRIS Digital Payment", desc: "Scan to pay with GoPay/OVO/ShopeePay QR" },
  gopay: { title: "GoPay Wallet", desc: "Pay via GoPay mobile app redirect" },
  flutterwave: { title: "Flutterwave", desc: "Debit card / Bank Transfer secure" },
  paystack: { title: "Paystack", desc: "Instant secure card verification" }
};

// Render Cart Details and Checkout Form
function renderCheckoutView() {
  const container = document.getElementById('storefront-content');
  if (!container) return;

  const loc = StorefrontLocales[ZanjiState.activeLanguage] || StorefrontLocales.en;

  if (ZanjiState.cart.length === 0) {
    container.innerHTML = `
      <div class="store-header" style="direction: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'rtl' : 'ltr'}">
        <div class="store-info" style="text-align: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'right' : 'left'}">
          <h2>${loc.secure_checkout}</h2>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="renderStorefrontCatalog()">
          <i data-lucide="arrow-left"></i> ${loc.back_to_products}
        </button>
      </div>
      <div style="text-align: center; padding: 4rem 1rem; color: var(--text-secondary);">
        <i data-lucide="shopping-bag" style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--text-muted);"></i>
        <p>${loc.cart_empty}</p>
        <button class="btn btn-sm" style="margin-top: 1rem;" onclick="renderStorefrontCatalog()">${loc.browse_catalog}</button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const currentConfig = RegionConfigs[ZanjiState.currentRegion];

  // Calculate totals
  const subtotal = ZanjiState.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const localSubtotal = Math.round(subtotal * currentConfig.rate);
  const shipping = Math.round(250 * currentConfig.rate); // Converted shipping
  const total = localSubtotal + shipping;

  let itemsHtml = '';
  ZanjiState.cart.forEach(item => {
    const itemPriceConverted = Math.round(item.product.price * currentConfig.rate);
    itemsHtml += `
      <div class="cart-summary-item" style="direction: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'rtl' : 'ltr'}">
        <div class="cart-item-thumb">
          <img src="${item.product.image}">
        </div>
        <div class="cart-item-details" style="flex: 1; text-align: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'right' : 'left'}">
          <h4>${item.product.title}</h4>
          <p>${currentConfig.symbol} ${itemPriceConverted.toLocaleString()} x ${item.quantity}</p>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; direction: ltr;">
          <button class="btn btn-secondary btn-sm" style="padding: 2px 8px;" onclick="changeCartQty(${item.product.id}, -1)">-</button>
          <span>${item.quantity}</span>
          <button class="btn btn-secondary btn-sm" style="padding: 2px 8px;" onclick="changeCartQty(${item.product.id}, 1)">+</button>
        </div>
      </div>
    `;
  });

  // Dynamic Cities dropdown
  let cityOptions = '';
  const regionCities = {
    PK: ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi"],
    AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
    ID: ["Jakarta", "Surabaya", "Bandung", "Medan", "Bali"],
    NG: ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt"],
    GL: ["New York", "London", "Toronto", "Sydney", "Riyadh"]
  };
  regionCities[ZanjiState.currentRegion].forEach(c => {
    cityOptions += `<option value="${c}">${c}</option>`;
  });

  // Dynamic Payment Options
  let paymentGatewaysHtml = '';
  currentConfig.gateway.forEach((gw, idx) => {
    const details = PaymentDetailsMap[gw];
    const isActive = idx === 0;
    if (isActive) {
      window.selectedPaymentMethod = gw;
    }
    paymentGatewaysHtml += `
      <div class="payment-method ${isActive ? 'active' : ''}" id="pay-${gw}" onclick="selectPayment('${gw}')">
        <div style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${isActive ? 'var(--accent-primary)' : 'transparent'};"></div>
        </div>
        <div class="payment-details" style="text-align: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'right' : 'left'};">
          <h4>${details.title}</h4>
          <p>${details.desc}</p>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <!-- Top Nav -->
    <div class="store-header" style="direction: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'rtl' : 'ltr'}">
      <div class="store-info" style="text-align: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'right' : 'left'}">
        <h2>${loc.secure_checkout}</h2>
        <p>${loc.checkout_completing} ${ZanjiState.storeName}</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="renderStorefrontCatalog()" style="gap: 6px;">
        <i data-lucide="arrow-left"></i> ${loc.back}
      </button>
    </div>

    <!-- Columns -->
    <div class="checkout-view" style="direction: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'rtl' : 'ltr'}">
      
      <!-- Checkout Form -->
      <div>
        <form onsubmit="handleCheckoutSubmit(event)">
          <div class="checkout-section-title">${loc.delivery_details}</div>
          
          <div class="input-group" style="text-align: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'right' : 'left'}">
            <label for="c-name">${loc.full_name}</label>
            <input type="text" id="c-name" class="input-control" required placeholder="Ayesha Ahmed" value="${ZanjiState.simulator.customerName}">
          </div>

          <div class="input-group" style="text-align: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'right' : 'left'}">
            <label for="c-phone">${loc.whatsapp_number}</label>
            <input type="tel" id="c-phone" class="input-control" required placeholder="+92 315 5556789" value="${ZanjiState.simulator.customerPhone}">
          </div>

          <div class="input-group" style="text-align: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'right' : 'left'}">
            <label for="c-address">${loc.shipping_address}</label>
            <input type="text" id="c-address" class="input-control" required placeholder="Apartment / House / Street Name" value="Phase 6, DHA, Street 15, House 8A">
          </div>

          <div class="input-group" style="text-align: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'right' : 'left'}">
            <label for="c-city">${loc.city}</label>
            <select id="c-city" class="input-control">
              ${cityOptions}
            </select>
          </div>

          <div class="checkout-section-title">${loc.payment_method}</div>
          <div class="payment-options">
            ${paymentGatewaysHtml}
          </div>

          <button type="submit" class="btn" style="width: 100%; justify-content: center; padding: 12px; margin-top: 1rem; gap: 6px;">
            <i data-lucide="lock"></i> ${loc.place_order} (${currentConfig.symbol} ${total.toLocaleString()})
          </button>
        </form>
      </div>

      <!-- Order Summary Column -->
      <div>
        <div class="cart-summary-card">
          <div class="checkout-section-title">${loc.order_items}</div>
          <div class="cart-items-list">
            ${itemsHtml}
          </div>
          
          <div class="cart-summary-row" style="direction: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'rtl' : 'ltr'}">
            <span>${loc.subtotal}</span>
            <span>${currentConfig.symbol} ${localSubtotal.toLocaleString()}</span>
          </div>
          <div class="cart-summary-row" style="direction: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'rtl' : 'ltr'}">
            <span>${loc.delivery_fee}</span>
            <span>${currentConfig.symbol} ${shipping.toLocaleString()}</span>
          </div>
          <div class="cart-summary-row total" style="direction: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'rtl' : 'ltr'}">
            <span>${loc.total_cost}</span>
            <span>${currentConfig.symbol} ${total.toLocaleString()}</span>
          </div>
        </div>
      </div>

    </div>
  `;
  
  lucide.createIcons();
}

// Modify cart quantities
function changeCartQty(productId, delta) {
  const item = ZanjiState.cart.find(item => item.product.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    ZanjiState.cart = ZanjiState.cart.filter(item => item.product.id !== productId);
  }

  renderCheckoutView();
}

// Select payment type toggle
function selectPayment(method) {
  window.selectedPaymentMethod = method;
  
  // Update UI selection classes
  const currentConfig = RegionConfigs[ZanjiState.currentRegion];
  currentConfig.gateway.forEach(gw => {
    const el = document.getElementById(`pay-${gw}`);
    if (el) {
      el.classList.remove('active');
      const radioOuter = el.querySelector('div');
      const radioInner = radioOuter.querySelector('div');
      radioOuter.style.borderColor = 'var(--border-color)';
      radioInner.style.backgroundColor = 'transparent';
    }
  });

  const activeEl = document.getElementById(`pay-${method}`);
  if (activeEl) {
    activeEl.classList.add('active');
    const activeOuter = activeEl.querySelector('div');
    const activeInner = activeOuter.querySelector('div');
    activeOuter.style.borderColor = 'var(--accent-primary)';
    activeInner.style.backgroundColor = 'var(--accent-primary)';
  }
}

// Place checkout order
function handleCheckoutSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('c-name').value;
  const phone = document.getElementById('c-phone').value;
  const address = document.getElementById('c-address').value;
  const city = document.getElementById('c-city').value;
  const payment = window.selectedPaymentMethod;

  const currentConfig = RegionConfigs[ZanjiState.currentRegion];
  const loc = StorefrontLocales[ZanjiState.activeLanguage] || StorefrontLocales.en;

  // Build order item list with converted prices
  const subtotal = ZanjiState.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const localSubtotal = Math.round(subtotal * currentConfig.rate);
  const shipping = Math.round(250 * currentConfig.rate);
  const total = localSubtotal + shipping;

  const newOrderId = ZanjiState.orders.length > 0 ? ZanjiState.orders[ZanjiState.orders.length - 1].id + 1 : 1001;

  const newOrder = {
    id: newOrderId,
    customerName: name,
    phone: phone,
    address: address,
    city: city,
    items: ZanjiState.cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
    total: subtotal + 250, // Save base price in orders state
    status: "pending",
    paymentMethod: payment,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    logistics: "",
    trackingNumber: ""
  };

  // Add to active orders state
  ZanjiState.orders.unshift(newOrder);

  // Clear Cart
  ZanjiState.cart = [];

  // Update success views
  const container = document.getElementById('storefront-content');
  container.innerHTML = `
    <div class="success-screen" style="direction: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'rtl' : 'ltr'}">
      <div class="success-icon">
        <i data-lucide="check-circle-2"></i>
      </div>
      <h2>${loc.order_confirmed}</h2>
      <p>${loc.thank_you} <strong>${name}</strong>, your order <strong>#${newOrderId}</strong> has been received.</p>
      <div style="background: rgba(255,255,255,0.02); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: ${ZanjiState.activeLanguage === 'ar' || ZanjiState.activeLanguage === 'ur' ? 'right' : 'left'}; width: 100%; max-width: 400px; margin: 1rem 0;">
        <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size: 0.85rem;"><span style="color:var(--text-secondary)">${loc.payment_status}:</span><strong>${payment === 'cod' ? loc.cod_pending : loc.payment_sent}</strong></div>
        <div style="display:flex; justify-content:space-between; font-size: 0.85rem;"><span style="color:var(--text-secondary)">${loc.delivery_to}:</span><strong>${city}</strong></div>
      </div>
      <button class="btn btn-sm" onclick="renderStorefrontCatalog()">${loc.continue_shopping}</button>
    </div>
  `;
  lucide.createIcons();

  // Send receipt update on WhatsApp simulator with multi-lingual responses
  setTimeout(() => {
    let customerNotice = `Paid & submitted checkout info via Zanji Secure Checkout.`;
    let merchantReply = `JazakAllah *${name}*! Your order *#${newOrderId}* is confirmed. 🎉\n\n` +
                        `💸 *Amount Due:* ${currentConfig.symbol} ${total.toLocaleString()}\n` +
                        `📍 *Delivery City:* ${city}\n` +
                        `💳 *Method:* ${payment.toUpperCase() === 'COD' ? 'Cash on Delivery' : payment.toUpperCase()}\n\n` +
                        `We will text you once your shipping label is generated by ${currentConfig.carrier.join('/')}.`;
    
    // Choose translations for WhatsApp chat updates based on activeLanguage
    const activeLang = ZanjiState.activeLanguage;
    if (activeLang === 'ur') {
      customerNotice = `زانجی سیکیور چیک آؤٹ کے ذریعے آرڈر کی معلومات جمع کروا دی گئیں۔`;
      merchantReply = `جزاک اللہ *${name}*! آپ کا آرڈر *#${newOrderId}* کنفرم ہو گیا ہے۔ 🎉\n\n` +
                       `💸 *کل رقم:* ${currentConfig.symbol} ${total.toLocaleString()}\n` +
                       `📍 *ڈیلیوری کا شہر:* ${city}\n` +
                       `💳 *طریقہ کار:* ${payment === 'cod' ? 'کیش آن ڈیلیوری' : payment.toUpperCase()}\n\n` +
                       `جیسے ہی شپنگ کمپنی ${currentConfig.carrier.join('/')} شپنگ لیبل جنریٹ کرے گی، ہم آپ کو واٹس ایپ کر دیں گے۔`;
    } else if (activeLang === 'ar') {
      customerNotice = `تم إرسال معلومات الطلب عبر بوابة دفع زانجي الآمنة.`;
      merchantReply = `شكرًا لك *${name}*! تم تأكيد طلبك رقم *#${newOrderId}*. 🎉\n\n` +
                       `💸 *المبلغ المستحق:* ${currentConfig.symbol} ${total.toLocaleString()}\n` +
                       `📍 *مدينة التوصيل:* ${city}\n` +
                       `💳 *طريقة الدفع:* ${payment === 'cod' ? 'الدفع عند الاستلام' : payment.toUpperCase()}\n\n` +
                       `سنقوم بإرسال إشعار تتبع بمجرد إصدار بوليصة الشحن من شركة التوصيل ${currentConfig.carrier.join('/')}.`;
    } else if (activeLang === 'id' || activeLang === 'jv' || activeLang === 'su') {
      customerNotice = `Informasi pengiriman pesanan telah dikirim melalui Zanji Secure Checkout.`;
      merchantReply = `Terima kasih *${name}*! Pesanan Anda *#${newOrderId}* telah dikonfirmasi. 🎉\n\n` +
                       `💸 *Jumlah Pembayaran:* ${currentConfig.symbol} ${total.toLocaleString()}\n` +
                       `📍 *Kota Pengiriman:* ${city}\n` +
                       `💳 *Metode:* ${payment === 'cod' ? 'Bayar di Tempat (COD)' : payment.toUpperCase()}\n\n` +
                       `Kami akan memberi tahu Anda setelah resi pengiriman diterbitkan oleh ${currentConfig.carrier.join('/')}.`;
    } else if (activeLang === 'bn') {
      customerNotice = `পেমেন্ট ও অর্ডারের বিবরণী সফলভাবে সাবমিট করা হয়েছে।`;
      merchantReply = `ধন্যবাদ *${name}*! আপনার অর্ডার *#${newOrderId}* সফলভাবে নিশ্চিত করা হয়েছে। 🎉\n\n` +
                       `💸 *মোট প্রদেয় বিল:* ${currentConfig.symbol} ${total.toLocaleString()}\n` +
                       `📍 *ডেলিভারি শহর:* ${city}\n` +
                       `💳 *পেমেন্ট পদ্ধতি:* ${payment === 'cod' ? 'ক্যাশ অন ডেলিভারি' : payment.toUpperCase()}\n\n` +
                       `${currentConfig.carrier.join('/')} এর মাধ্যমে শিপিং লেবেল তৈরি করা হলে আপনাকে নিশ্চিত করা হবে।`;
    }

    appendWaMessage('customer', customerNotice);
    
    setTimeout(() => {
      appendWaMessage('merchant', merchantReply);
    }, 1000);
  }, 500);

  // Auto switch merchant back to Portal Dashboard after 4 seconds to view the new order
  setTimeout(() => {
    switchView('merchant');
    switchMerchantSection('orders');
    
    const topRow = document.getElementById(`order-item-${newOrderId}`);
    if (topRow) {
      topRow.style.outline = '2px solid var(--accent-primary)';
      topRow.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.2)';
      setTimeout(() => {
        topRow.style.transition = 'all 1s';
        topRow.style.outline = 'none';
        topRow.style.boxShadow = 'none';
      }, 3000);
    }
  }, 4000);
}
