/* ==========================================
   ZANJI MERCHANT PORTAL & OPERATIONS HUB
   ========================================== */

let salesChartInstance = null;

function initMerchant() {
  renderMerchantDashboard();
  renderMerchantCatalog();
  renderMerchantOrders();
  renderBroadcastHistory();
}

// Calculate dynamic analytics based on order state
function calculateAnalytics() {
  const currentConfig = RegionConfigs[ZanjiState.currentRegion];
  const successfulOrders = ZanjiState.orders.filter(o => o.status !== 'abandoned');
  
  // Convert base total in orders dynamically
  const grossSales = successfulOrders.reduce((sum, o) => sum + Math.round(o.total * currentConfig.rate), 0);
  const totalOrders = ZanjiState.orders.length;
  
  // Update stat nodes in DOM
  const salesEl = document.getElementById('stat-sales');
  if (salesEl) salesEl.innerText = `${currentConfig.symbol} ${grossSales.toLocaleString()}`;
  
  const ordersEl = document.getElementById('stat-orders');
  if (ordersEl) ordersEl.innerText = totalOrders;
  
  // Recalculate top products based on catalog sales
  ZanjiState.products.sort((a,b) => b.sales - a.sales);
}

// Render dynamic elements inside dashboard
function renderMerchantDashboard() {
  calculateAnalytics();
  
  const currentConfig = RegionConfigs[ZanjiState.currentRegion];

  // Render Top Products List
  const topList = document.getElementById('top-products-list');
  if (topList) {
    topList.innerHTML = '';
    
    // Take top 3
    ZanjiState.products.slice(0, 3).forEach(p => {
      const localPrice = Math.round(p.price * currentConfig.rate);
      const row = document.createElement('div');
      row.style = 'display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03)';
      row.innerHTML = `
        <img src="${p.image}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">
        <div style="flex:1;">
          <h4 style="font-size:0.85rem; font-weight:600;">${p.title}</h4>
          <p style="font-size:0.75rem; color:var(--text-secondary);">${p.sales} units sold</p>
        </div>
        <div style="font-family: var(--font-heading); font-weight:700; font-size:0.9rem;">${currentConfig.symbol} ${(localPrice * p.sales).toLocaleString()}</div>
      `;
      topList.appendChild(row);
    });
  }
}

// Draw dynamic sales Chart.js graph
function renderAnalyticsChart() {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  // Draw simulated dashboard data
  salesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Sales Revenue (k PKR)',
          data: [12, 19, 15, 28, 22, 34, 45],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          tension: 0.4,
          fill: true,
          borderWidth: 3
        },
        {
          label: 'Conversion Rate (%)',
          data: [18, 21, 20, 25, 23, 24, 28],
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          tension: 0.4,
          borderWidth: 2,
          borderDash: [5, 5],
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 10 } }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: { color: '#9ca3af' }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: { color: '#9ca3af' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#9ca3af' }
        }
      }
    }
  });
}

// Render dynamic Product Catalog (Merchant view)
function renderMerchantCatalog() {
  const grid = document.getElementById('catalog-products-grid');
  if (!grid) return;

  const currentConfig = RegionConfigs[ZanjiState.currentRegion];

  grid.innerHTML = '';
  ZanjiState.products.forEach(p => {
    const localPrice = Math.round(p.price * currentConfig.rate);
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-img-container">
        <img src="${p.image}">
      </div>
      <div class="product-body">
        <div class="product-title">${p.title}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-footer">
          <span class="product-price">${currentConfig.symbol} ${localPrice.toLocaleString()}</span>
          <span style="font-size:0.75rem; color:var(--text-secondary);">Stock: <strong>${p.stock}</strong></span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Render Order Managers List (Merchant view)
function renderMerchantOrders() {
  const list = document.getElementById('order-manager-list');
  if (!list) return;

  const currentConfig = RegionConfigs[ZanjiState.currentRegion];

  list.innerHTML = '';
  ZanjiState.orders.forEach(o => {
    const item = document.createElement('div');
    item.className = 'order-item';
    item.id = `order-item-${o.id}`;
    
    // Build items description preview
    let itemLabels = [];
    o.items.forEach(orderItem => {
      const match = ZanjiState.products.find(p => p.id === orderItem.productId);
      if (match) itemLabels.push(`${match.title} (x${orderItem.quantity})`);
    });

    const localTotal = Math.round(o.total * currentConfig.rate);

    item.innerHTML = `
      <div class="order-info">
        <h4 style="display:flex; align-items:center; gap: 8px;">
          Order #${o.id} <span style="font-weight: 400; font-size: 0.8rem; color: var(--text-muted);">${o.date}</span>
        </h4>
        <p style="margin: 4px 0;"><i data-lucide="user" style="width: 12px; height:12px; vertical-align:middle; margin-right: 2px;"></i> ${o.customerName} (${o.phone})</p>
        <p style="color:var(--text-secondary); font-size:0.75rem;">${itemLabels.join(', ')}</p>
      </div>
      <div class="order-meta">
        <span class="order-price">${currentConfig.symbol} ${localTotal.toLocaleString()}</span>
        <div style="display:flex; align-items:center; gap: 8px;">
          <span class="status-badge ${o.status}">${o.status}</span>
          <button class="btn btn-secondary btn-sm" onclick="openOrderOperations(${o.id})" style="padding: 3px 8px;">
            Manage <i data-lucide="sliders" style="width: 12px; height: 12px;"></i>
          </button>
        </div>
      </div>
    `;
    list.appendChild(item);
  });
  lucide.createIcons();
}

// Mock AI product descriptions copywriting generator
function generateMockAiDescription() {
  const title = document.getElementById('p-title').value.trim();
  const descArea = document.getElementById('p-desc');
  
  if (!title) {
    alert("Please enter a Product Name first to generate custom copy!");
    return;
  }

  // Pre-loader animation state
  descArea.value = "Generating sales copy tailored for Pakistani social buyers...";
  
  setTimeout(() => {
    const templates = [
      `🌟 Elegant ${title}. Premium quality fabric with high-density threads. Perfect styling option for casual wear or family get-togethers in Pakistan. Durable wash-and-wear material with intricate stitching details. Order on WhatsApp for prompt delivery.`,
      `✨ Exquisite ${title}. Super soft texture crafted for ultimate comfort. Features rich traditional aesthetics blended with modern cuts. Perfect wear for lawns, gatherings, or office work. Fits true to standard size charts. Get yours now!`,
      `🔥 Limited Stock! Beautiful ${title} designed by Zari Boutique. Elegant embroidery, standard sizing, premium stitching. Perfect for formal and semi-formal wear. Cash on Delivery (COD) available across Pakistan.`
    ];
    
    // Choose random
    descArea.value = templates[Math.floor(Math.random() * templates.length)];
  }, 1200);
}

// Save added product
function handleNewProductSubmit(event) {
  event.preventDefault();
  
  const title = document.getElementById('p-title').value;
  const price = parseFloat(document.getElementById('p-price').value);
  const image = document.getElementById('p-image').value;
  const desc = document.getElementById('p-desc').value;
  const stock = parseInt(document.getElementById('p-stock').value);

  const newP = {
    id: ZanjiState.products.length + 1,
    title,
    price,
    image,
    desc,
    stock,
    sales: 0
  };

  ZanjiState.products.push(newP);
  closeModal('add-product-modal');
  
  // Reset form
  document.getElementById('add-product-form').reset();
  
  // Re-render catalog view
  renderMerchantCatalog();
  
  // Send update notification on WhatsApp simulator for listing with converted price
  const currentConfig = RegionConfigs[ZanjiState.currentRegion];
  const localPrice = Math.round(price * currentConfig.rate);
  appendWaMessage('merchant', `📢 *New Arrival Alert!* We have just added *"${title}"* to our collection for ${currentConfig.symbol} ${localPrice.toLocaleString()}. Type *menu* to view details!`);
}

// Open logistics details modal
function openOrderOperations(orderId) {
  const order = ZanjiState.orders.find(o => o.id === orderId);
  if (!order) return;

  const content = document.getElementById('order-details-modal-content');
  if (!content) return;

  const currentConfig = RegionConfigs[ZanjiState.currentRegion];
  const regionNames = { PK: "Pakistan", AE: "UAE", ID: "Indonesia", NG: "Nigeria", GL: "Global / Other" };

  let itemsHtml = '';
  order.items.forEach(oi => {
    const match = ZanjiState.products.find(p => p.id === oi.productId);
    if (match) {
      const matchLocalPrice = Math.round(match.price * currentConfig.rate);
      itemsHtml += `<li>${match.title} (x${oi.quantity}) - ${currentConfig.symbol} ${(matchLocalPrice * oi.quantity).toLocaleString()}</li>`;
    }
  });

  const localTotal = Math.round(order.total * currentConfig.rate);

  // Dynamic Carrier Options
  let carrierOptions = '';
  currentConfig.carrier.forEach(c => {
    carrierOptions += `<option value="${c}" ${order.logistics === c ? 'selected' : ''}>${c} Delivery</option>`;
  });

  content.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:1.25rem;">
      <div style="background: rgba(255,255,255,0.02); padding:1rem; border-radius:8px; border:1px solid var(--border-color);">
        <h4 style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span>Order #${order.id}</span>
          <span style="font-family: var(--font-heading); color: var(--accent-primary);">${currentConfig.symbol} ${localTotal.toLocaleString()}</span>
        </h4>
        <ul style="padding-left:18px; font-size:0.85rem; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px; text-align: left;">
          ${itemsHtml}
        </ul>
      </div>

      <div style="text-align: left;">
        <h4 style="font-size:0.9rem; margin-bottom:8px;">Customer Delivery Info</h4>
        <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5;">
          <strong>Name:</strong> ${order.customerName}<br>
          <strong>WhatsApp:</strong> ${order.phone}<br>
          <strong>Address:</strong> ${order.address}, ${order.city}, ${regionNames[ZanjiState.currentRegion]}
        </div>
      </div>

      <div class="checkout-section-title" style="margin-top:0.5rem; margin-bottom:0.75rem;">Logistics Update Dashboard</div>
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; text-align: left;">
        <div class="input-group">
          <label>Fulfillment Status</label>
          <select id="op-status" class="input-control">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          </select>
        </div>
        
        <div class="input-group">
          <label>Shipping Carrier Partner</label>
          <select id="op-carrier" class="input-control">
            ${carrierOptions}
          </select>
        </div>
      </div>

      <div class="input-group" style="text-align: left;">
        <label>Tracking Number (Auto-assigned or enter custom)</label>
        <input type="text" id="op-tracking" class="input-control" value="${order.trackingNumber || generateMockTracking(order.logistics || currentConfig.carrier[0])}">
      </div>

      <div style="display:flex; gap:10px; margin-top:1rem;">
        <button class="btn btn-secondary" style="flex:1;" onclick="closeModal('order-details-modal')">Discard</button>
        <button class="btn" style="flex:1;" onclick="saveOrderOperations(${order.id})">Update Status & Notify</button>
      </div>
    </div>
  `;

  openModal('order-details-modal');
  lucide.createIcons();
}

function generateMockTracking(carrier) {
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return carrier === 'Leopards' ? `LP-${randNum}` : `TCS-${randNum}`;
}

// Update order details and trigger WhatsApp updates to customer
function saveOrderOperations(orderId) {
  const order = ZanjiState.orders.find(o => o.id === orderId);
  if (!order) return;

  const newStatus = document.getElementById('op-status').value;
  const newCarrier = document.getElementById('op-carrier').value;
  const newTracking = document.getElementById('op-tracking').value;

  const statusChanged = order.status !== newStatus;

  order.status = newStatus;
  order.logistics = newCarrier;
  order.trackingNumber = newTracking;

  closeModal('order-details-modal');
  renderMerchantOrders();
  renderMerchantDashboard();

  // Send WhatsApp updates
  if (statusChanged) {
    setTimeout(() => {
      if (newStatus === 'shipped') {
        appendWaMessage('merchant', 
          `Salaam *${order.customerName}*! Your order *#${order.id}* has been shipped via *${newCarrier}*. 🚚\n\n` +
          `📦 *Tracking Link:* WhatsApp track dashboard enabled\n` +
          `🔢 *Tracking ID:* ${newTracking}\n\n` +
          `Package will arrive in 2-3 business days. Cash on delivery courier will collect due amount if applicable.`,
          { type: 'tracking_btn', carrier: newCarrier, status: 'shipped', trackingId: newTracking }
        );
      } 
      else if (newStatus === 'delivered') {
        appendWaMessage('merchant', 
          `Alhamdulillah! Your order *#${order.id}* has been marked as delivered by *${newCarrier}* check tracker. 🎉\n\n` + 
          `Thank you for shopping with us! Hope you love your new outfit. Let us know if you want to browse our latest catalog again. Type *menu* to open shopping window.`
        );
      }
    }, 1000);
  }
}

// Broadcast History Manager
function renderBroadcastHistory() {
  const list = document.getElementById('broadcast-history-list');
  if (!list) return;

  list.innerHTML = '';
  ZanjiState.broadcasts.forEach(b => {
    const item = document.createElement('div');
    item.className = 'broadcast-item';
    item.innerHTML = `
      <div class="broadcast-item-header">
        <strong>${b.name}</strong>
        <span>${b.date}</span>
      </div>
      <div class="broadcast-item-body">${b.message.replace('{catalog_link}', '<u>zanji.shop/zari-boutique</u>')}</div>
      <div class="broadcast-stats">
        <div class="broadcast-stat"><i data-lucide="check" style="width: 12px; height:12px;"></i> Sent: ${b.recipients}</div>
        <div class="broadcast-stat delivered"><i data-lucide="check-check" style="width: 12px; height:12px;"></i> Delivered: ${b.delivered}</div>
        <div class="broadcast-stat read" style="color: #38a1f3"><i data-lucide="eye" style="width: 12px; height:12px;"></i> Read: ${b.read}</div>
        <div class="broadcast-stat clicked"><i data-lucide="mouse-pointer" style="width: 12px; height:12px;"></i> Clicks: ${b.clicked}</div>
      </div>
    `;
    list.appendChild(item);
  });
  lucide.createIcons();
}

// Segment size estimate helper
function calculateSegmentSize(val) {
  let costText = '';
  if (val === 'all') costText = '0.00 PKR (MVP sandbox limits)';
  if (val === 'abandoned') costText = '0.00 PKR (Pre-configured recovery sandbox)';
  if (val === 'vip') costText = '0.00 PKR (VIP sandbox active)';
  document.getElementById('broadcast-cost-estimate').innerText = costText;
}

// Prefill campaign fields
function prefillBroadcast(type) {
  openModal('create-broadcast-modal');
  
  const nameEl = document.getElementById('b-name');
  const segmentEl = document.getElementById('b-segment');
  const msgEl = document.getElementById('b-message');

  if (type === 'abandoned') {
    nameEl.value = 'Abandoned Checkout Follow-up';
    segmentEl.value = 'abandoned';
    msgEl.value = 'Salam {name}! We noticed you left some gorgeous items in your cart. Check out now to secure free shipping using link: {catalog_link}';
  } else if (type === 'eid') {
    nameEl.value = 'Eid Discount Broadcast';
    segmentEl.value = 'all';
    msgEl.value = 'Eid Mubarak! 🌙 Special festive sale at Zari Boutique. Flat 15% off using code EID15. Shop now: {catalog_link}';
  } else if (type === 'new') {
    nameEl.value = 'Lawn New Arrivals';
    segmentEl.value = 'vip';
    msgEl.value = 'Salam! Our latest Velvet & Linen collections are now live. Browse products and place orders instantly on WhatsApp: {catalog_link}';
  }
  
  calculateSegmentSize(segmentEl.value);
}

// Trigger campaign broadcast
function handleBroadcastSubmit(event) {
  event.preventDefault();

  // SaaS subscription limits check
  if (ZanjiState.wabaConfig.subscription === 'free') {
    alert("❌ Upgrade Required: The Free Starter Plan only allows individual WABA chat replies. Upgrade to the Pro Plan under Settings & Billing to unlock outbound Broadcast Campaigns!");
    return;
  }

  const name = document.getElementById('b-name').value;
  const segment = document.getElementById('b-segment').value;
  const message = document.getElementById('b-message').value;

  let recipients = 185;
  if (segment === 'abandoned') recipients = 12;
  if (segment === 'vip') recipients = 35;

  const newB = {
    id: ZanjiState.broadcasts.length + 1,
    name,
    segment: segment === 'all' ? 'All Active Contacts' : (segment === 'abandoned' ? 'Abandoned Cart Users' : 'VIP Repeat Shoppers'),
    message,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    recipients,
    delivered: recipients,
    read: Math.floor(recipients * 0.9),
    clicked: Math.floor(recipients * 0.25)
  };

  // POST campaign to server proxy for real API sending (if credentials present)
  fetch('http://localhost:3000/api/send-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: ZanjiState.storeNumber, // mock WABA connected group
      text: message,
      isBroadcast: true
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log('[Zanji Client] Broadcast server send status:', data);
    if (!data.success && data.error && data.error.includes("Upgrade")) {
      alert("❌ " + data.error);
    }
  })
  .catch(err => {
    console.warn('[Zanji Client] Webhook backend offline, sent in local fallback sandbox mode.');
  });

  ZanjiState.broadcasts.unshift(newB);
  closeModal('create-broadcast-modal');
  document.getElementById('broadcast-campaign-form').reset();
  
  renderBroadcastHistory();

  // Highlight campaign success simulation in Chat Box for visual presentation
  setTimeout(() => {
    alert(`Zanji broadcast launched successfully! Triggering simulation preview message on customer phone.`);
    
    // Simulate sending message to active buyer phone
    let previewMessage = message
      .replace('{name}', ZanjiState.simulator.customerName)
      .replace('{catalog_link}', '*zanji.shop/zari-boutique*');
      
    appendWaMessage('merchant', previewMessage, {
      type: 'catalog_btn',
      label: 'Shop Sale Collection'
    });
  }, 500);
}

// ==========================================
// UNIFIED INBOX DISPLAY & INTERACTION LOGIC
// ==========================================
function renderMerchantInbox() {
  const threadsContainer = document.getElementById('inbox-threads-container');
  const detailsHeader = document.getElementById('inbox-thread-header-details');
  const messagesBody = document.getElementById('inbox-thread-messages-body');

  if (!threadsContainer) return;

  // 1. Render Threads List
  threadsContainer.innerHTML = '';
  ZanjiState.inboxThreads.forEach(t => {
    const threadEl = document.createElement('div');
    threadEl.className = `inbox-thread-item ${t.id === ZanjiState.activeThreadId ? 'active' : ''}`;
    threadEl.onclick = () => selectInboxThread(t.id);
    
    // Sync WhatsApp snippet from simulator
    let lastMsg = t.messages.length > 0 ? t.messages[t.messages.length - 1].text : '';
    if (t.channel === 'whatsapp' && ZanjiState.simulator.messages.length > 0) {
      lastMsg = ZanjiState.simulator.messages[ZanjiState.simulator.messages.length - 1].text;
    }
    
    const lastMsgTruncated = lastMsg.length > 25 ? lastMsg.substring(0, 25) + '...' : lastMsg;
    const unreadDot = t.unread ? `<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-danger); display: inline-block;"></span>` : '';

    threadEl.innerHTML = `
      <div style="flex: 1; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 0.9rem; font-weight: 600;">${t.name}</strong>
          ${unreadDot}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.75rem; color: var(--text-secondary); max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${lastMsgTruncated}</span>
          <span class="inbox-badge ${t.channel}">${t.channel}</span>
        </div>
      </div>
    `;
    threadsContainer.appendChild(threadEl);
  });

  // 2. Fetch Active Thread
  const activeThread = ZanjiState.inboxThreads.find(t => t.id === ZanjiState.activeThreadId);
  if (!activeThread) return;

  // 3. Render Header Details
  let opOptionsHtml = `<option value="">Unassigned</option>`;
  ZanjiState.operators.forEach(op => {
    const isSelected = activeThread.assignedOperatorId === op.id ? 'selected' : '';
    opOptionsHtml += `<option value="${op.id}" ${isSelected}>${op.name} (${op.active ? '🟢' : '🔴'})</option>`;
  });

  detailsHeader.innerHTML = `
    <div style="text-align: left;">
      <h4 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 8px; margin: 0;">
        ${activeThread.name} <span class="inbox-badge ${activeThread.channel}">${activeThread.channel}</span>
      </h4>
      <span style="font-size: 0.75rem; color: var(--text-secondary);">${activeThread.handle}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <label for="assignee-select-${activeThread.id}" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Assignee:</label>
        <select id="assignee-select-${activeThread.id}" class="input-control" style="font-size: 0.8rem; padding: 4px 8px; height: 28px; width: 140px; background: rgba(0,0,0,0.3); border-color: var(--border-color); color: var(--text-primary); cursor: pointer;" onchange="changeThreadOperator(${activeThread.id}, this.value)">
          ${opOptionsHtml}
        </select>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--accent-primary);"></span>
        Connected & Live
      </div>
    </div>
  `;

  // 4. Render Message Logs
  messagesBody.innerHTML = '';
  
  // Render CTWA Ad Referral Card at the top of the message body if referral data is present
  if (activeThread.referrerAd) {
    const ref = activeThread.referrerAd;
    const refCard = document.createElement('div');
    refCard.className = 'ctwa-referral-card';
    refCard.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)';
    refCard.style.border = '1px solid rgba(59, 130, 246, 0.2)';
    refCard.style.borderRadius = 'var(--radius-md)';
    refCard.style.padding = '12px';
    refCard.style.marginBottom = '15px';
    refCard.style.display = 'flex';
    refCard.style.gap = '12px';
    refCard.style.alignItems = 'center';
    
    const adThumbnail = ref.mediaUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100&q=80';
    const headline = ref.headline || 'Eid Lawn Special Sale';
    const body = ref.body || 'Flat 20% Off on all hand-printed lawn collections. Free shipping across Pakistan.';
    const adId = ref.sourceId || 'AD-983749';
    const campaignName = ref.campaignName || 'Eid Lawn Special Sale';
    const voucher = ref.voucherCode ? `<div style="font-size: 0.75rem; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px dashed rgba(59, 130, 246, 0.4); padding: 2px 6px; border-radius: 4px; display: inline-block; font-weight: 600; margin-top: 4px;">Discount Code: ${ref.voucherCode}</div>` : '';
    
    refCard.innerHTML = `
      <img src="${adThumbnail}" alt="Ad Thumbnail" style="width: 60px; height: 60px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid rgba(255,255,255,0.1);">
      <div style="flex: 1; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
          <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary); font-weight: 700;">Facebook/Instagram Ad Referral</span>
          <span style="font-size: 0.65rem; color: var(--text-muted);">Ad ID: ${adId}</span>
        </div>
        <h4 style="font-size: 0.85rem; font-weight: 600; margin: 0 0 2px 0; color: var(--text-primary);">${campaignName}</h4>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0 0 4px 0;">"${headline}" - ${body}</p>
        ${voucher}
      </div>
    `;
    messagesBody.appendChild(refCard);
  }
  
  // Dynamic sync if thread is WhatsApp (read from simulator messages)
  let msgsToRender = activeThread.messages;
  if (activeThread.channel === 'whatsapp') {
    msgsToRender = ZanjiState.simulator.messages.map(m => ({
      sender: m.sender,
      text: m.text,
      time: m.time,
      voice: m.voice
    }));
  }

  msgsToRender.forEach(m => {
    const bubble = document.createElement('div');
    const isMerchant = m.sender === 'merchant';
    const isSystem = m.sender === 'system';
    if (isSystem) {
      bubble.className = 'wa-message system';
      bubble.style.alignSelf = 'center';
    } else {
      bubble.className = `wa-message ${isMerchant ? 'sent' : 'received'}`;
      bubble.style.alignSelf = isMerchant ? 'flex-end' : 'flex-start';
      if (isMerchant) {
        bubble.style.background = 'var(--accent-primary)';
        bubble.style.color = '#fff';
      } else {
        bubble.style.background = 'rgba(255,255,255,0.05)';
        bubble.style.color = 'var(--text-primary)';
      }
    }

    if (m.voice) {
      bubble.innerHTML = `
        <div class="wa-voice-bubble" style="direction: ltr;">
          <button class="wa-voice-play-btn" onclick="alert('Playing simulated customer voice note...')">
            <i data-lucide="play" style="width: 16px; height: 16px; fill: currentColor;"></i>
          </button>
          <div class="wa-waveform-container">
            <span class="wa-waveform-bar active" style="height: 10px;"></span>
            <span class="wa-waveform-bar active" style="height: 18px;"></span>
            <span class="wa-waveform-bar active" style="height: 12px;"></span>
            <span class="wa-waveform-bar active" style="height: 22px;"></span>
            <span class="wa-waveform-bar" style="height: 14px;"></span>
            <span class="wa-waveform-bar" style="height: 8px;"></span>
            <span class="wa-waveform-bar" style="height: 16px;"></span>
            <span class="wa-waveform-bar" style="height: 10px;"></span>
          </div>
          <span class="wa-voice-duration" style="font-size:0.75rem; color:var(--text-muted)">0:12</span>
        </div>
        <div style="font-size: 0.8rem; font-style: italic; color: var(--text-secondary); margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px; text-align: left;">
          Transcription: "${m.text}"
        </div>
        <span class="wa-msg-time" style="color: rgba(255,255,255,0.6);">${m.time}</span>
      `;
    } else {
      bubble.innerHTML = `
        <div>${m.text.replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>
        <span class="wa-msg-time" style="color: rgba(255,255,255,0.6);">${m.time}</span>
      `;
    }
    messagesBody.appendChild(bubble);
  });

  // Render AI Draft Order Card at bottom of WhatsApp chat if active
  if (activeThread.channel === 'whatsapp' && ZanjiState.activeVoiceDraft) {
    const draft = ZanjiState.activeVoiceDraft;
    const draftCard = document.createElement('div');
    draftCard.className = 'ai-draft-alert-card';
    
    const currentConfig = RegionConfigs[ZanjiState.currentRegion];
    const totalLocal = Math.round(draft.total * currentConfig.rate);
    
    const riskBadge = draft.riskTier ? `
      <div style="margin-top: 6px; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; display: inline-flex; align-items: center; gap: 4px;
        background: ${draft.riskTier === 'Red' ? 'rgba(239, 68, 68, 0.15)' : draft.riskTier === 'Yellow' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'};
        color: ${draft.riskTier === 'Red' ? '#ef4444' : draft.riskTier === 'Yellow' ? '#f59e0b' : '#10b981'};
        border: 1px solid ${draft.riskTier === 'Red' ? 'rgba(239, 68, 68, 0.3)' : draft.riskTier === 'Yellow' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'};">
        <i data-lucide="shield" style="width: 12px; height: 12px;"></i> Shield: ${draft.riskTier} Risk
      </div>
    ` : '';

    draftCard.innerHTML = `
      <h4 style="display:flex; align-items:center; gap:6px;"><i data-lucide="sparkles" style="width: 16px; height: 16px;"></i> AI Draft Order (Voice-to-Order)</h4>
      <div class="ai-draft-details" style="text-align: left;">
        <strong>Product:</strong> ${draft.productTitle}<br>
        <strong>Quantity:</strong> ${draft.quantity}<br>
        <strong>Price:</strong> ${currentConfig.symbol} ${totalLocal.toLocaleString()} (+ Shipping)<br>
        <strong>Customer Name:</strong> ${draft.customerName}<br>
        <strong>Address:</strong> ${draft.address}, ${draft.city}
        ${riskBadge ? `<br>${riskBadge}` : ''}
      </div>
      <div class="ai-draft-actions" style="margin-top:10px;">
        <button class="btn btn-sm" onclick="approveVoiceOrderDraft()" style="background: var(--accent-purple); border-color: var(--accent-purple); display:flex; align-items:center; gap:4px; height: 32px;"><i data-lucide="check" style="width: 14px; height: 14px;"></i> Approve & Invoice</button>
        <button class="btn btn-secondary btn-sm" onclick="rejectVoiceOrderDraft()" style="display:flex; align-items:center; gap:4px; height: 32px;"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Decline</button>
      </div>
    `;
    messagesBody.appendChild(draftCard);
  }

  messagesBody.scrollTop = messagesBody.scrollHeight;
  lucide.createIcons();
}

function selectInboxThread(threadId) {
  ZanjiState.activeThreadId = threadId;
  const thread = ZanjiState.inboxThreads.find(t => t.id === threadId);
  if (thread) thread.unread = false;
  
  renderMerchantInbox();
}

function sendInboxMerchantReply() {
  const inputEl = document.getElementById('inbox-reply-input');
  if (!inputEl) return;

  const text = inputEl.value.trim();
  if (text === '') return;

  inputEl.value = '';

  const activeThread = ZanjiState.inboxThreads.find(t => t.id === ZanjiState.activeThreadId);
  if (!activeThread) return;

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const msgObj = { sender: 'merchant', text, time };

  // Append to local messages log
  activeThread.messages.push(msgObj);

  // Sync to WhatsApp simulator if WhatsApp thread is active
  if (activeThread.channel === 'whatsapp') {
    appendWaMessage('merchant', text);

    // Call server API proxy to send real WABA message
    fetch('http://localhost:3000/api/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: activeThread.handle, // Customer phone number
        text: text
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('[Zanji Client] Message proxy dispatch response:', data);
    })
    .catch(err => {
      console.warn('[Zanji Client] Webhook gateway offline, sent in local fallback sandbox mode.');
    });
  }

  renderMerchantInbox();

  // Trigger Simulated Customer Auto-Replies for other channels to show loop
  if (activeThread.channel === 'instagram') {
    setTimeout(() => {
      activeThread.messages.push({
        sender: 'customer',
        text: "JazakAllah! Order placed via catalog link. Sent screenshot to your page inbox.",
        time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
      });
      activeThread.unread = true;
      if (ZanjiState.activeMerchantSection === 'inbox') {
        renderMerchantInbox();
      }
    }, 1500);
  } else if (activeThread.channel === 'messenger') {
    setTimeout(() => {
      activeThread.messages.push({
        sender: 'customer',
        text: "Awesome! Please share the TCS tracking link once dispatched.",
        time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
      });
      activeThread.unread = true;
      if (ZanjiState.activeMerchantSection === 'inbox') {
        renderMerchantInbox();
      }
    }, 2000);
  }
}

function handleInboxInputKey(event) {
  if (event.key === 'Enter') {
    sendInboxMerchantReply();
  }
}

// Approve the AI Draft Order created via voice message
function approveVoiceOrderDraft() {
  if (!ZanjiState.activeVoiceDraft) return;
  const draft = ZanjiState.activeVoiceDraft;
  const currentConfig = RegionConfigs[ZanjiState.currentRegion];
  
  // Assign new order ID
  const newOrderId = ZanjiState.orders.length > 0 ? ZanjiState.orders[ZanjiState.orders.length - 1].id + 1 : 1001;
  const totalWithShipping = draft.total + 250; // base values
  const totalLocal = Math.round(totalWithShipping * currentConfig.rate);

  const newOrder = {
    id: newOrderId,
    customerName: draft.customerName,
    phone: draft.phone,
    address: draft.address,
    city: draft.city,
    items: [{ productId: draft.productId, quantity: draft.quantity }],
    total: totalWithShipping, // base total
    status: "pending",
    paymentMethod: "cod", // Default to COD
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    logistics: "",
    trackingNumber: ""
  };

  // Add order
  ZanjiState.orders.unshift(newOrder);
  
  // Clear draft
  ZanjiState.activeVoiceDraft = null;
  
  // Re-render UI views
  renderMerchantInbox();
  renderMerchantOrders();
  renderMerchantDashboard();

  // Notify buyer on WhatsApp simulator
  let notificationMessage = `JazakAllah *${draft.customerName}*! I have approved your draft order *#${newOrderId}* via voice note. 🎉\n\n` +
                            `💸 *Amount Due:* ${currentConfig.symbol} ${totalLocal.toLocaleString()}\n` +
                            `📍 *Delivery Address:* ${draft.address}, ${draft.city}\n` +
                            `💳 *Method:* Cash on Delivery (COD)\n\n` +
                            `Your shipping label will be generated shortly.`;
                            
  // Urdu translation override
  if (ZanjiState.activeLanguage === 'ur') {
    notificationMessage = `جزاک اللہ *${draft.customerName}*! میں نے آپ کا وائس نوٹ کے ذریعے آرڈر *#${newOrderId}* منظور کر لیا ہے۔ 🎉\n\n` +
                          `💸 *کل رقم:* ${currentConfig.symbol} ${totalLocal.toLocaleString()}\n` +
                          `📍 *ڈیلیوری کا پتہ:* ${draft.address}، ${draft.city}\n` +
                          `💳 *طریقہ کار:* کیش آن ڈیلیوری (COD)\n\n` +
                          `جلد ہی آپ کا شپنگ لیبل جنریٹ کر دیا جائے گا۔`;
  } else if (ZanjiState.activeLanguage === 'id') {
    notificationMessage = `Terima kasih *${draft.customerName}*! Pesanan draf Anda *#${newOrderId}* via pesan suara telah dikonfirmasi. 🎉\n\n` +
                          `💸 *Jumlah Pembayaran:* ${currentConfig.symbol} ${totalLocal.toLocaleString()}\n` +
                          `📍 *Alamat Pengiriman:* ${draft.address}, ${draft.city}\n` +
                          `💳 *Metode:* Bayar di Tempat (COD)\n\n` +
                          `Resi pengiriman Anda akan segera diterbitkan.`;
  }

  appendWaMessage('merchant', notificationMessage);
  alert(`AI Draft Order Approved! Order #${newOrderId} created and customer notified.`);
}

// Decline the voice order draft
function rejectVoiceOrderDraft() {
  if (!ZanjiState.activeVoiceDraft) return;
  alert("AI Draft Order declined.");
  ZanjiState.activeVoiceDraft = null;
  renderMerchantInbox();
}

// Handle Instagram Catalog import crawling sequence
function handleInstagramImportSubmit(event) {
  event.preventDefault();
  
  const username = document.getElementById('ig-username').value.trim();
  const count = parseInt(document.getElementById('ig-post-count').value);
  
  if (!username) return;

  const btn = document.getElementById('ig-submit-btn');
  const container = document.getElementById('ig-progress-container');
  const bar = document.getElementById('ig-progress-bar');
  const status = document.getElementById('ig-progress-status');
  const subtext = document.getElementById('ig-progress-subtext');
  const percent = document.getElementById('ig-progress-percent');

  // Disable form and show progress
  btn.disabled = true;
  container.style.display = 'block';
  
  const stages = [
    { percent: 10, status: "Handshake...", subtext: `Contacting Instagram API for profile @${username}...` },
    { percent: 35, status: "Fetching Posts...", subtext: "Retrieving recent media posts and image buffers..." },
    { percent: 65, status: "Gemini Vision Analyzer...", subtext: "Extracting product listings, materials, and price tags using Gemini AI..." },
    { percent: 90, status: "Cataloging...", subtext: "Auto-generating product categories, pricing, and high-converting descriptions..." },
    { percent: 100, status: "Import Complete!", subtext: `Successfully imported ${count} items into catalog!` }
  ];

  let currentStageIndex = 0;
  const interval = setInterval(() => {
    if (currentStageIndex < stages.length) {
      const stage = stages[currentStageIndex];
      bar.style.width = `${stage.percent}%`;
      status.innerText = stage.status;
      subtext.innerText = stage.subtext;
      percent.innerText = `${stage.percent}%`;
      currentStageIndex++;
    } else {
      clearInterval(interval);
      
      // Dynamic mock products from Instagram feed
      const mockIgProducts = [
        {
          id: ZanjiState.products.length + 1,
          title: "Silk Block-Print Saree",
          price: 6500,
          image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80",
          desc: "Authentic block-print silk saree with gorgeous zari borders. Crafted by artisans. Perfect wedding and party attire.",
          stock: 15,
          sales: 4
        },
        {
          id: ZanjiState.products.length + 2,
          title: "Artisan Peshawari Chappal",
          price: 3200,
          image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=400&q=80",
          desc: "Hand-stitched leather Peshawari chappals featuring tire-sole base. Extremely durable and classic traditional fit.",
          stock: 20,
          sales: 8
        },
        {
          id: ZanjiState.products.length + 3,
          title: "Chikankari Linen Kurta",
          price: 2850,
          image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80",
          desc: "Light and airy summer linen kurta decorated with fine Chikankari hand embroidery. Fit: Loose casual comfort.",
          stock: 30,
          sales: 2
        }
      ];

      // Add to state products (add matching number based on count select)
      for (let i = 0; i < count; i++) {
        if (mockIgProducts[i]) {
          ZanjiState.products.push(mockIgProducts[i]);
        }
      }

      // Hide modal & reset
      closeModal('instagram-import-modal');
      btn.disabled = false;
      container.style.display = 'none';
      document.getElementById('instagram-import-form').reset();

      // Refresh catalog views
      renderMerchantCatalog();
      renderMerchantDashboard();

      // Trigger WhatsApp announcement in chat
      const currentConfig = RegionConfigs[ZanjiState.currentRegion];
      appendWaMessage('merchant', `📢 *Instagram Collection Live!* We have just synced our latest Instagram catalog feed directly to WhatsApp! Check out our new arrivals. Type *menu* to browse.`);
      
      alert(`Successfully imported ${count} items from Instagram! Product catalog updated.`);
    }
  }, 1000);
}

/* ==========================================
   WABA SETTINGS & SAAS SUBSCRIPTIONS
   ========================================== */

let sseEventSource = null;

// Connect to real-time events channel on backend
function initServerSentEvents() {
  if (sseEventSource) {
    sseEventSource.close();
  }
  
  console.log('[Zanji Client] Opening Server-Sent Events stream connection to port 3000...');
  sseEventSource = new EventSource('http://localhost:3000/events');
  
  // 1. Listen for global configuration syncs
  sseEventSource.addEventListener('config_sync', (e) => {
    try {
      const config = JSON.parse(e.data);
      console.log('[Zanji Client] Received config sync from server:', config);
      ZanjiState.wabaConfig = config;
      updateWabaSettingsUI(config);
    } catch (err) {
      console.error('[Zanji Client] Error syncing configuration:', err);
    }
  });

  // 2. Listen for incoming WhatsApp webhook messages pushed from server
  sseEventSource.addEventListener('whatsapp_incoming', (e) => {
    try {
      const msg = JSON.parse(e.data);
      console.log('[Zanji Client] Webhook WhatsApp incoming packet received:', msg);
      handleIncomingMetaMessage(msg);
    } catch (err) {
      console.error('[Zanji Client] Error parsing incoming webhook packet:', err);
    }
  });

  // 3. Listen for asynchronous voice note processing pipeline completions
  sseEventSource.addEventListener('whatsapp_pipeline_complete', (e) => {
    try {
      const data = JSON.parse(e.data);
      console.log('[Zanji Client] Async AI Pipeline Complete event received:', data);
      
      // Map currency symbols
      const currencySymbol = data.extracted.order_metadata?.currency === 'PKR' ? 'Rs.' : 
                             data.extracted.order_metadata?.currency === 'AED' ? 'AED' :
                             data.extracted.order_metadata?.currency === 'IDR' ? 'Rp' : '$';

      // Update the voice draft with the real extracted data from Gemini!
      ZanjiState.activeVoiceDraft = {
        productTitle: data.extracted.line_items?.[0]?.product_name || "Custom Order",
        productId: 3, // Default product ID
        quantity: data.extracted.line_items?.[0]?.quantity || 1,
        total: 1999, // Base price in catalog
        customerName: data.extracted.customer_details?.name || data.name || "Ayesha Ahmed",
        address: data.extracted.shipping_address?.street_address || "Clifton Block 4",
        city: data.extracted.shipping_address?.city || "Karachi",
        riskTier: data.risk?.riskTier || "Green",
        alertMessage: data.risk?.alertMessage || null,
        phone: data.phone
      };

      // Append system message inside chat simulator to visually alert merchant
      const riskColor = data.risk?.riskTier === 'Red' ? '#ef4444' : data.risk?.riskTier === 'Yellow' ? '#f59e0b' : '#10b981';
      
      ZanjiState.simulator.messages.push({
        sender: 'system',
        text: `🧠 *AI Pipeline parsed voice note!*<br>` +
              `📦 *Items:* ${data.extracted.line_items?.map(it => `${it.quantity}x ${it.product_name}`).join(', ')}<br>` +
              `🛡️ *Shield Risk:* <span style="color: ${riskColor}; font-weight: bold;">${data.risk?.riskTier || 'Green'}</span><br>` +
              (data.risk?.actionRequired ? `⚠️ *Action Sent:* _"${data.risk.alertMessage}"_` : `✅ *Check passed.*`),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // If buyer has high risk, automatically trigger and log the merchant auto-reply alert
      if (data.risk?.actionRequired && data.risk.alertMessage) {
        setTimeout(() => {
          appendWaMessage('merchant', data.risk.alertMessage);
          if (ZanjiState.activeMerchantSection === 'inbox') {
            renderMerchantInbox();
          }
        }, 1000);
      }

      // Re-render dashboard components
      if (ZanjiState.activeMerchantSection === 'inbox') {
        renderMerchantInbox();
      }
      renderWaMessages();
    } catch (err) {
      console.error('[Zanji Client] Error handling whatsapp_pipeline_complete:', err);
    }
  });
  
  sseEventSource.onerror = (err) => {
    console.warn('[Zanji Client] EventSource connection failed. Gateway server offline.');
    // Set UI to disconnected
    updateWabaSettingsUI({ status: 'disconnected', subscription: ZanjiState.wabaConfig.subscription });
  };
}

// Load configurations from state into DOM
function loadWabaSettings() {
  const config = ZanjiState.wabaConfig;
  
  const appIdEl = document.getElementById('waba-app-id');
  const phoneIdEl = document.getElementById('waba-phone-id');
  const tokenEl = document.getElementById('waba-token');
  const verifyTokenEl = document.getElementById('waba-verify-token');
  
  if (appIdEl) appIdEl.value = config.wabaId || '';
  if (phoneIdEl) phoneIdEl.value = config.phoneId || '';
  if (tokenEl) tokenEl.value = config.accessToken || '';
  if (verifyTokenEl) verifyTokenEl.value = config.verifyToken || 'merchant_secret_token';
  
  const strategyEl = document.getElementById('routing-strategy');
  if (strategyEl) strategyEl.value = ZanjiState.routingAlgorithm || 'round-robin';
  renderOperatorsSettingsList();
  
  updateWabaSettingsUI(config);
}

// Render active operators inside the settings tab
function renderOperatorsSettingsList() {
  const container = document.getElementById('operators-list-container');
  if (!container) return;
  container.innerHTML = '';
  ZanjiState.operators.forEach(op => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.style.padding = '10px 12px';
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'center';
    card.style.background = 'rgba(255,255,255,0.02)';
    card.style.borderColor = 'var(--border-color)';
    
    const statusText = op.active ? 'Active' : 'Offline';
    const statusDotColor = op.active ? '#10b981' : '#ef4444';
    
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusDotColor};"></span>
        <div>
          <h4 style="font-size: 0.85rem; margin: 0 0 2px 0; color: var(--text-primary);">${op.name}</h4>
          <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0;">${statusText}</p>
        </div>
      </div>
      <label class="switch-container" style="position: relative; display: inline-block; width: 34px; height: 20px;">
        <input type="checkbox" ${op.active ? 'checked' : ''} onchange="toggleOperatorStatus(${op.id})" style="opacity: 0; width: 0; height: 0;">
        <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${op.active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}; transition: .4s; border-radius: 34px; display: flex; align-items: center; padding: 2px;">
          <span style="height: 16px; width: 16px; background-color: white; border-radius: 50%; transition: .4s; transform: ${op.active ? 'translateX(14px)' : 'translateX(0)'};"></span>
        </span>
      </label>
    `;
    container.appendChild(card);
  });
}

// Toggle active state of operator from settings
function toggleOperatorStatus(opId) {
  const op = ZanjiState.operators.find(o => o.id === opId);
  if (op) {
    op.active = !op.active;
    console.log(`[Zanji Client] Operator ${op.name} active status toggled to: ${op.active}`);
    renderOperatorsSettingsList();
  }
}

// Modify routing strategy selection
function changeRoutingAlgorithm(val) {
  ZanjiState.routingAlgorithm = val;
  console.log(`[Zanji Client] Routing algorithm changed to: ${val}`);
}

// Save configuration updates to local server database
function saveWabaSettings(event) {
  if (event) event.preventDefault();
  
  const wabaId = document.getElementById('waba-app-id').value.trim();
  const phoneId = document.getElementById('waba-phone-id').value.trim();
  const accessToken = document.getElementById('waba-token').value.trim();
  const verifyToken = document.getElementById('waba-verify-token').value.trim();
  
  const updatedConfig = {
    wabaId,
    phoneId,
    accessToken,
    verifyToken,
    status: (phoneId && accessToken) ? 'live' : 'sandbox'
  };
  
  console.log('[Zanji Client] Sending settings updates to server...');
  
  fetch('http://localhost:3000/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedConfig)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("API Configurations saved & deployed successfully!");
      ZanjiState.wabaConfig = data.config;
      updateWabaSettingsUI(data.config);
    } else {
      alert("Failed to save settings: " + data.error);
    }
  })
  .catch(err => {
    console.error('[Zanji Client] Failed to reach settings API endpoint:', err);
    // Offline / local fallback logic
    ZanjiState.wabaConfig = { ...ZanjiState.wabaConfig, ...updatedConfig };
    updateWabaSettingsUI(ZanjiState.wabaConfig);
    alert("Connection to backend server timed out. Settings saved locally in browser memory.");
  });
}

// Update WABA UI Elements (Badge states & highlights)
function updateWabaSettingsUI(config) {
  const badge = document.getElementById('waba-status-badge');
  if (badge) {
    badge.className = `status-badge ${config.status}`;
    if (config.status === 'live') {
      badge.innerText = 'Connected & Live';
      badge.style.background = 'rgba(16, 185, 129, 0.1)';
      badge.style.color = 'var(--accent-primary)';
    } else if (config.status === 'sandbox') {
      badge.innerText = 'API Sandbox Active';
      badge.style.background = 'rgba(245, 158, 11, 0.1)';
      badge.style.color = 'var(--accent-orange)';
    } else {
      badge.innerText = 'Server Offline';
      badge.style.background = 'rgba(239, 68, 68, 0.1)';
      badge.style.color = 'var(--accent-danger)';
    }
  }
  
  // Highlight active SaaS billing tier
  const tiers = ['free', 'pro', 'enterprise'];
  tiers.forEach(t => {
    const card = document.getElementById(`plan-tier-${t}`);
    const btn = document.getElementById(`btn-select-${t}`);
    
    if (card && btn) {
      if (t === config.subscription) {
        card.style.borderColor = 'var(--accent-primary)';
        card.style.background = 'rgba(16, 185, 129, 0.04)';
        card.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.1)';
        btn.className = 'btn btn-sm';
        btn.innerText = 'Active Subscription';
        btn.style.background = 'var(--accent-primary)';
        btn.style.color = '#fff';
      } else {
        card.style.borderColor = 'var(--border-color)';
        card.style.background = 'rgba(255, 255, 255, 0.02)';
        card.style.boxShadow = 'none';
        btn.className = 'btn btn-secondary btn-sm';
        btn.style.background = 'rgba(255,255,255,0.03)';
        btn.style.color = 'var(--text-secondary)';
        if (t === 'free') btn.innerText = 'Downgrade to Starter';
        if (t === 'pro') btn.innerText = 'Upgrade to Pro';
        if (t === 'enterprise') btn.innerText = 'Upgrade to Enterprise';
      }
    }
  });
}

// Modify active SaaS tier plan
function changeSaaSPlan(planCode) {
  console.log(`[Zanji Client] Requesting plan upgrade to: ${planCode}`);
  
  fetch('http://localhost:3000/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: planCode })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      ZanjiState.wabaConfig = data.config;
      updateWabaSettingsUI(data.config);
      alert(`SaaS subscription updated to: ${planCode.toUpperCase()} Plan!`);
    }
  })
  .catch(err => {
    console.warn('[Zanji Client] Local server offline, changing SaaS plan locally:', planCode);
    ZanjiState.wabaConfig.subscription = planCode;
    updateWabaSettingsUI(ZanjiState.wabaConfig);
  });
}

// Handle live incoming webhook payloads
function handleIncomingMetaMessage(msg) {
  const time = msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Parse and process incoming event
  if (msg.isVoice) {
    // 1. Play chime sound
    try {
      const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-100.wav');
      chime.volume = 0.5;
      chime.play();
    } catch(e) {}

    // 2. Append Voice note to customer thread
    ZanjiState.simulator.messages.push({
      sender: 'customer',
      text: msg.text,
      time: time,
      voice: true
    });

    // 3. Populate AI Voice Order Draft values
    ZanjiState.activeVoiceDraft = {
      productTitle: "Velvet Hand-Worked Khussa",
      productId: 3,
      quantity: 1,
      total: 1999, // Base price in catalog (will be converted in view)
      customerName: msg.name || "Ayesha Ahmed",
      address: "Clifton Block 4, Sea Breeze Apt 5B",
      city: "Karachi"
    };

    // 4. Auto-reply via chatbot
    setTimeout(() => {
      appendWaMessage('merchant', `Assalam-o-Alaikum *${msg.name}*! I have received your voice note and drafted your order details. The merchant will review and send your invoice link shortly.`);
      if (ZanjiState.activeMerchantSection === 'inbox') {
        renderMerchantInbox();
      }
    }, 1500);
    
  } else {
    // Standard incoming message chime
    try {
      const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-100.wav');
      chime.volume = 0.3;
      chime.play();
    } catch(e) {}

    ZanjiState.simulator.messages.push({
      sender: 'customer',
      text: msg.text,
      time: time,
      referral: msg.referral || undefined
    });

    // Attach referral details to the thread if present
    const thread = ZanjiState.inboxThreads.find(t => t.id === 1); // Thread 1 is WhatsApp
    if (msg.referral && thread) {
      thread.referrerAd = msg.referral;
      routeThreadAuto(thread);
    }

    // Handle standard bot auto-response keywords
    if (typeof processBotReply === 'function') {
      setTimeout(() => {
        processBotReply(msg.text);
      }, 1000);
    }
  }

  // Refresh active views
  if (typeof renderWaMessages === 'function') {
    renderWaMessages();
  }
  
  if (ZanjiState.activeMerchantSection === 'inbox') {
    renderMerchantInbox();
  }
}

// ==========================================
// TEAM ROUTING ENGINE & AD REFERRAL SIMULATOR
// ==========================================

// Auto-route chat threads to active operators using round-robin
function routeThreadAuto(thread) {
  if (ZanjiState.routingAlgorithm !== 'round-robin') {
    console.log('[Zanji Client] Manual routing algorithm is active. Thread left as is.');
    return;
  }
  const activeOps = ZanjiState.operators.filter(op => op.active);
  if (activeOps.length === 0) {
    console.log('[Zanji Client] No active operators available for assignment.');
    return;
  }
  const op = activeOps[ZanjiState.activeOperatorCursor % activeOps.length];
  ZanjiState.activeOperatorCursor++;
  
  thread.assignedOperatorId = op.id;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const assignMsg = `System assigned this chat to ${op.name} (Round-Robin)`;
  
  if (thread.channel === 'whatsapp') {
    ZanjiState.simulator.messages.push({
      sender: 'system',
      text: assignMsg,
      time: time
    });
  }
  
  // also add to thread messages
  thread.messages.push({
    sender: 'system',
    text: assignMsg,
    time: time
  });
  
  console.log(`[Zanji Client] Thread ${thread.id} automatically assigned to ${op.name}`);
}

// Manually update operator assignment
function changeThreadOperator(threadId, operatorId) {
  const thread = ZanjiState.inboxThreads.find(t => t.id === threadId);
  if (!thread) return;
  
  const opId = operatorId ? parseInt(operatorId) : null;
  thread.assignedOperatorId = opId;
  
  const op = ZanjiState.operators.find(o => o.id === opId);
  const opName = op ? op.name : 'Unassigned';
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const changeMsg = `Chat manually assigned to ${opName}`;
  
  if (thread.channel === 'whatsapp') {
    ZanjiState.simulator.messages.push({
      sender: 'system',
      text: changeMsg,
      time: time
    });
  }
  
  thread.messages.push({
    sender: 'system',
    text: changeMsg,
    time: time
  });
  
  console.log(`[Zanji Client] Thread ${threadId} manual assignment updated to ${opName}`);
  
  if (typeof renderWaMessages === 'function') {
    renderWaMessages();
  }
  renderMerchantInbox();
}

// Simulate Click-to-WhatsApp Ad click lead arrival
function simulateIncomingAdLead() {
  console.log('[Zanji Client] Simulating incoming CTWA Ad Lead...');
  
  const referralData = {
    sourceType: 'ad',
    sourceId: 'AD-' + Math.floor(100000 + Math.random() * 900000),
    sourceUrl: 'https://fb.com/ads/example',
    headline: 'Eid Lawn Special Sale!',
    body: 'Flat 20% off on premium lawn collections. Buy 2 get free shipping.',
    mediaUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=150&q=80',
    campaignName: 'Eid Special Inflow',
    voucherCode: 'EID20'
  };
  
  // Call local server endpoint to simulate this webhook payload
  fetch('http://localhost:3000/api/simulate-incoming', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+92 315 5556789',
      name: 'Ayesha Ahmed',
      type: 'text',
      text: 'I saw your Eid discount ad. Can I order this on WhatsApp?',
      referral: referralData
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('[Zanji Client] Simulated ad lead sent successfully.');
    } else {
      console.warn('[Zanji Client] Failed to trigger ad lead on server, falling back locally...');
      localFallbackAdLead(referralData);
    }
  })
  .catch(err => {
    console.warn('[Zanji Client] Server offline. Simulating ad lead locally...', err);
    localFallbackAdLead(referralData);
  });
}

function localFallbackAdLead(referralData) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msg = {
    sender: 'customer',
    phone: '+92 315 5556789',
    name: 'Ayesha Ahmed',
    timestamp: time,
    type: 'text',
    text: 'I saw your Eid discount ad. Can I order this on WhatsApp?',
    referral: referralData
  };
  handleIncomingMetaMessage(msg);
}

/**
 * Example UI rendering block for an incoming order item card.
 * Instantly changes colors based on the risk assessment tier to guide the operator.
 * @param {Object} chatThread - Conversation thread context with risk assessment parameters.
 * @returns {string} HTML string representing the UI order card.
 */
function renderOrderCard(chatThread) {
    let badgeColor = "bg-green-100 text-green-800"; // Default Green
    let actionAlert = "Ready to pack and ship.";

    if (chatThread.riskTier === 'RED') {
        badgeColor = "bg-red-100 text-red-800 animate-pulse";
        actionAlert = "⚠️ CRITICAL: Verification SMS sent. Hold shipment until GPS pin is received!";
    } else if (chatThread.riskTier === 'YELLOW') {
        badgeColor = "bg-yellow-100 text-yellow-800";
        actionAlert = "⚡ Check address formatting before calling carrier.";
    }

    return `
        <div class="p-4 border-b border-gray-200 hover:bg-gray-50">
            <div class="flex justify-between items-center">
                <span class="text-sm font-bold text-gray-900">${chatThread.buyerPhone}</span>
                <span class="px-2 py-1 text-xs font-semibold rounded ${badgeColor}">${chatThread.riskTier} RISK</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">Destination: ${chatThread.deliveryCity}</p>
            <p class="text-xs font-medium text-indigo-600 mt-2">${actionAlert}</p>
        </div>
    `;
}




