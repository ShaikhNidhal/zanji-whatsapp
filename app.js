// Global Region Configurations
const RegionConfigs = {
  PK: { currency: "PKR", symbol: "PKR", gateway: ["cod", "jazzcash", "easypaisa"], carrier: ["TCS", "Leopards"], rate: 1, greet: "Assalam-o-Alaikum! Welcome to *Zari Boutique* 🌸" },
  AE: { currency: "AED", symbol: "AED", gateway: ["stripe", "applepay", "cod"], carrier: ["Aramex", "Fetchr"], rate: 0.013, greet: "Marhaban! Welcome to *Zari Boutique* 🌸" },
  ID: { currency: "IDR", symbol: "Rp", gateway: ["qris", "gopay", "cod"], carrier: ["J&T Express", "GoSend"], rate: 58.5, greet: "Selamat Datang! Welcome to *Zari Boutique* 🌸" },
  NG: { currency: "NGN", symbol: "₦", gateway: ["flutterwave", "paystack", "cod"], carrier: ["Sendy", "DHL"], rate: 5.3, greet: "Welcome to *Zari Boutique* 🌸" },
  GL: { currency: "USD", symbol: "$", gateway: ["stripe", "cod"], carrier: ["DHL Express", "FedEx"], rate: 0.0036, greet: "Hello! Welcome to *Zari Boutique* 🌸" }
};

// Global Application State Object
const ZanjiState = {
  // Store Info
  storeName: "Zari Boutique",
  storeNumber: "+92 300 1234567",
  customerAuthenticated: false, // QR WhatsApp Login State
  currentRegion: "PK", // Global active region
  activeLanguage: "ur", // Global active language
  activeVoiceDraft: null, // AI parsed voice order draft
  
  // Team routing & operators state
  operators: [
    { id: 1, name: "Ahmed Raza", active: true },
    { id: 2, name: "Sana Khan", active: true },
    { id: 3, name: "Bilal Shah", active: false }
  ],
  activeOperatorCursor: 0,
  routingAlgorithm: "round-robin", // 'round-robin' | 'manual'
  
  // Meta WABA settings & SaaS tiers state
  wabaConfig: {
    wabaId: "",
    phoneId: "",
    accessToken: "",
    verifyToken: "merchant_secret_token",
    status: "disconnected",
    subscription: "free"
  },
  
  // Active View State
  activeView: 'merchant', // 'merchant' | 'storefront'
  activeMerchantSection: 'dashboard', // 'dashboard' | 'catalog' | 'orders' | 'broadcast'
  
  // Dynamic Catalog State
  products: [
    {
      id: 1,
      title: "Linen Block-Print Kurti",
      price: 2450,
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80",
      desc: "Pure premium summer linen featuring hand-crafted traditional block prints. Breathable, light-weight, and perfect for casual wear. Pre-shrunk.",
      stock: 35,
      sales: 18
    },
    {
      id: 2,
      title: "Khaddi Embroidered Shawl",
      price: 4800,
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80",
      desc: "Classic raw khaddi shawl with intricate zari wool embroidery. Perfect accessory for winter evening functions. Length: 2.5 meters.",
      stock: 12,
      sales: 14
    },
    {
      id: 3,
      title: "Velvet Hand-Worked Khussa",
      price: 1999,
      image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=400&q=80",
      desc: "Royal velvet khussas adorned with hand-sewn dabka and tilla embroidery. Leather inner sole for comfortable festive wear.",
      stock: 8,
      sales: 22
    },
    {
      id: 4,
      title: "Silk Printed Dupatta",
      price: 1500,
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80",
      desc: "Elegant 100% pure silk dupatta featuring floral and geometric motifs. Gives a premium traditional touch to any solid suit.",
      stock: 40,
      sales: 9
    }
  ],

  // Orders State
  orders: [
    {
      id: 1001,
      customerName: "Ali Raza",
      phone: "+92 300 7654321",
      address: "DHA Phase 5, Block C, House 24",
      city: "Lahore",
      items: [{ productId: 1, quantity: 1 }],
      total: 2450,
      status: "delivered",
      paymentMethod: "cod",
      date: "May 28, 2026",
      logistics: "TCS",
      trackingNumber: "TCS-827492"
    },
    {
      id: 1002,
      customerName: "Sana Khan",
      phone: "+92 321 9876543",
      address: "Clifton Block 4, Sea Breeze Apt 5B",
      city: "Karachi",
      items: [{ productId: 2, quantity: 1 }, { productId: 3, quantity: 1 }],
      total: 6799,
      status: "shipped",
      paymentMethod: "easypaisa",
      date: "May 30, 2026",
      logistics: "Leopards",
      trackingNumber: "LP-983021"
    },
    {
      id: 1003,
      customerName: "Bilal Shah",
      phone: "+92 333 4567890",
      address: "F-10/2, Street 18, House 5A",
      city: "Islamabad",
      items: [{ productId: 4, quantity: 2 }],
      total: 3000,
      status: "pending",
      paymentMethod: "jazzcash",
      date: "June 01, 2026",
      logistics: "",
      trackingNumber: ""
    }
  ],

  // Active Customer Cart (For Storefront View)
  cart: [],

  // Broadcast History Logs
  broadcasts: [
    {
      id: 1,
      name: "Ramadan Mubarak Sale",
      segment: "All Active Contacts",
      message: "Assalam-o-Alaikum! 🌙 Celebrate Ramadan with Zari Boutique. Get flat 15% discount on our block print kurtas. Open link to view catalog and order directly on WhatsApp: {catalog_link}",
      date: "May 15, 2026",
      recipients: 185,
      delivered: 182,
      read: 168,
      clicked: 48
    },
    {
      id: 2,
      name: "Cart Recovery Campaign #42",
      segment: "Abandoned Cart Users",
      message: "Hi {name}! You left some beautiful hand-crafted items in your cart. Direct checkout with 1-click here: {catalog_link}. Reply to this message if you need help with sizing!",
      date: "May 29, 2026",
      recipients: 8,
      delivered: 8,
      read: 8,
      clicked: 5
    }
  ],

  // Unified Inbox State
  activeThreadId: 1,
  inboxThreads: [
    {
      id: 1,
      name: "Ayesha Ahmed",
      channel: "whatsapp",
      unread: false,
      handle: "+92 315 5556789",
      assignedOperatorId: 2, // Sana Khan
      referrerAd: null, // No ad referral initially
      messages: [
        { sender: 'customer', text: 'hi', time: '19:57' },
        { sender: 'merchant', text: 'Assalam-o-Alaikum! Welcome to *Zari Boutique* 🌸. We turn WhatsApp messages into instant checkouts!\n\nType *menu* or click below to view our summer lawn & handmade footwear catalogs.', time: '19:58' }
      ]
    },
    {
      id: 2,
      name: "Zainab Shah",
      channel: "instagram",
      unread: true,
      handle: "@zainab_shah_design",
      assignedOperatorId: 1, // Ahmed Raza
      referrerAd: null,
      messages: [
        { sender: 'customer', text: 'Assalam-o-Alaikum, is the Khaddi Embroidered Shawl available in pure wool?', time: '10:15' },
        { sender: 'merchant', text: 'Walikum Assalam Zainab! Yes, it is 100% pure raw wool embroidery.', time: '10:17' },
        { sender: 'customer', text: 'Great! Can I pay via Easypaisa?', time: '10:20' }
      ]
    },
    {
      id: 3,
      name: "Hamza Ali",
      channel: "messenger",
      unread: false,
      handle: "Hamza Ali (FB Profile)",
      assignedOperatorId: null, // Unassigned
      referrerAd: null,
      messages: [
        { sender: 'customer', text: 'AOA, what is the shipping time for Rawalpindi?', time: 'Yesterday' },
        { sender: 'merchant', text: 'Walikum Assalam Hamza, delivery to Rawalpindi takes 2-3 working days via TCS.', time: 'Yesterday' },
        { sender: 'customer', text: 'Perfect, placing order now.', time: 'Yesterday' }
      ]
    }
  ],

  // Current Simulator State
  simulator: {
    customerName: "Ayesha Ahmed",
    customerPhone: "+92 315 5556789",
    messages: [
      {
        sender: 'merchant',
        text: "Assalam-o-Alaikum! Welcome to *Zari Boutique* 🌸. We turn WhatsApp messages into instant checkouts!\n\nType *menu* or click below to view our summer lawn & handmade footwear catalogs.",
        time: "19:58",
        interactive: {
          type: 'catalog_btn',
          label: "Browse Catalog"
        }
      }
    ],
    // Quick chips shown on customer WhatsApp interface
    suggestions: ["hi", "menu", "my order status", "sim recovery alert"]
  }
};

// Global view switches
function switchView(view) {
  ZanjiState.activeView = view;
  
  // Toggle visual states
  document.getElementById('btn-merchant-view').classList.toggle('active', view === 'merchant');
  document.getElementById('btn-storefront-view').classList.toggle('active', view === 'storefront');
  
  document.getElementById('merchant-tab').classList.toggle('active', view === 'merchant');
  document.getElementById('storefront-tab').classList.toggle('active', view === 'storefront');
  
  if (view === 'storefront') {
    initStorefront();
  } else {
    initMerchant();
  }
  
  lucide.createIcons();
}

function switchMerchantSection(section) {
  ZanjiState.activeMerchantSection = section;
  
  // Style active sublink
  const links = document.querySelectorAll('.merchant-nav-link');
  links.forEach(link => {
    const text = link.innerText.toLowerCase();
    link.classList.toggle('active', text.includes(section));
  });

  // Hide all sections, show active
  document.getElementById('merchant-sec-dashboard').style.display = (section === 'dashboard') ? 'block' : 'none';
  document.getElementById('merchant-sec-catalog').style.display = (section === 'catalog') ? 'block' : 'none';
  document.getElementById('merchant-sec-orders').style.display = (section === 'orders') ? 'block' : 'none';
  document.getElementById('merchant-sec-broadcast').style.display = (section === 'broadcast') ? 'block' : 'none';
  document.getElementById('merchant-sec-inbox').style.display = (section === 'inbox') ? 'block' : 'none';
  document.getElementById('merchant-sec-settings').style.display = (section === 'settings') ? 'block' : 'none';

  if (section === 'dashboard') {
    // Redraw charts
    setTimeout(renderAnalyticsChart, 50);
  } else if (section === 'inbox') {
    renderMerchantInbox();
  } else if (section === 'settings') {
    if (typeof loadWabaSettings === 'function') {
      loadWabaSettings();
    }
  }
  
  lucide.createIcons();
}

// Modal Helpers
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Dynamic IP Geolocation detection function
async function detectRegionByIp() {
  console.log("Detecting country by IP...");
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      const detectedCountry = data.country_code; // e.g. PK, AE, ID, NG, US, etc.
      console.log(`IP Geo IP detected: ${detectedCountry} (${data.country_name})`);
      
      let targetRegion = "PK"; // Default
      if (RegionConfigs[detectedCountry]) {
        targetRegion = detectedCountry;
      } else {
        targetRegion = "GL"; // Global fallback
      }
      
      changeGlobalRegion(targetRegion);
      
      const selector = document.getElementById('region-selector');
      if (selector) {
        selector.value = targetRegion;
      }
    }
  } catch (error) {
    console.warn("IP country detection failed, using defaults:", error);
    changeGlobalRegion("PK");
  }
}

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  // Sync phone clock
  const updatePhoneTime = () => {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hrs}:${mins}`;
    const el = document.getElementById('simulator-time');
    if (el) el.innerText = timeStr;
  };
  updatePhoneTime();
  setInterval(updatePhoneTime, 60000);

  // Load modules
  initWhatsApp();
  initMerchant();
  initStorefront();
  
  // Connect to SSE backend server for Meta API notifications
  if (typeof initServerSentEvents === 'function') {
    initServerSentEvents();
  }
  
  // Auto-detect region on load
  detectRegionByIp();
  
  // Draw chart initially
  setTimeout(renderAnalyticsChart, 100);
});

// Global region changer
function changeGlobalRegion(regionCode) {
  ZanjiState.currentRegion = regionCode;
  const config = RegionConfigs[regionCode];
  
  // Auto-sync default language for region
  const regionLanguages = { PK: "ur", AE: "ar", ID: "id", NG: "yo" };
  ZanjiState.activeLanguage = regionLanguages[regionCode] || "en";
  
  // Set default chatbot greeting for this region
  if (ZanjiState.simulator.messages.length > 0) {
    ZanjiState.simulator.messages[0].text = config.greet + "\n\nType *menu* or click below to view our summer lawn & handmade footwear catalogs.";
  }
  
  // Update header display info if present
  const numberEl = document.getElementById('merchant-number-display');
  if (numberEl) {
    const prefixes = { PK: "+92 300 1234567", AE: "+971 50 1234567", ID: "+62 812 1234567", NG: "+234 80 1234567", GL: "+1 202 5550143" };
    numberEl.innerHTML = `Connected Number: <strong>${prefixes[regionCode] || "+1 202 5550143"}</strong>`;
  }

  // Update demo active region text
  const regionEl = document.getElementById('demo-active-region');
  if (regionEl) {
    regionEl.innerText = regionCode;
  }

  // Reload views
  initWhatsApp();
  initMerchant();
  initStorefront();
  
  // Redraw charts
  setTimeout(renderAnalyticsChart, 50);
}

// Toggle Floating Demo Control Panel Drawer
function toggleDemoPanel() {
  const panel = document.getElementById('demo-tester-wrapper');
  if (panel) {
    panel.classList.toggle('active');
  }
}

// Automatically runs preset scenarios to showcase usability
function triggerDemoScenario(scenarioNumber) {
  // Collapse panel after selection
  toggleDemoPanel();
  
  if (scenarioNumber === 1) {
    // Scenario 1: WhatsApp QR Handshake & Storefront Login
    alert("Running Scenario 1: Initiating WhatsApp verification scan handshake.");
    switchView('storefront');
    if (typeof simulateQrScan === 'function') {
      simulateQrScan();
    }
  } 
  else if (scenarioNumber === 2) {
    // Scenario 2: Conversational Voice Order
    alert("Running Scenario 2: Customer is recording a voice order message on WhatsApp.");
    switchView('merchant');
    switchMerchantSection('inbox');
    if (typeof startSimulatedVoiceRecording === 'function') {
      startSimulatedVoiceRecording();
    }
  } 
  else if (scenarioNumber === 3) {
    // Scenario 3: Simulate Checkout Cart Abandonment & Bot Auto-Recovery
    alert("Running Scenario 3: Simulating cart abandonment and triggering bot auto-recovery alert.");
    switchView('merchant');
    switchMerchantSection('dashboard');
    setTimeout(() => {
      // Send the recovery alert trigger inside the WhatsApp chat
      if (typeof sendWaSuggestion === 'function') {
        sendWaSuggestion('sim recovery alert');
      }
    }, 1000);
  } 
  else if (scenarioNumber === 4) {
    // Scenario 4: 1-Click Instagram Catalog Ingestion
    alert("Running Scenario 4: Opening Catalog Manager to trigger 1-Click Instagram Catalog Import.");
    switchView('merchant');
    switchMerchantSection('catalog');
    setTimeout(() => {
      if (typeof openModal === 'function') {
        openModal('instagram-import-modal');
      }
    }, 800);
  } 
  else if (scenarioNumber === 5) {
    // Scenario 5: Launch Eid Mubarak Broadcast Campaign
    alert("Running Scenario 5: Opening Broadcast Campaign Manager prefilled with Eid Mubarak templates.");
    switchView('merchant');
    switchMerchantSection('broadcast');
    setTimeout(() => {
      if (typeof prefillBroadcast === 'function') {
        prefillBroadcast('eid');
      }
    }, 800);
  }
  else if (scenarioNumber === 6) {
    // Scenario 6: CTWA Ad Lead & Auto-Route
    alert("Running Scenario 6: Simulating Click-to-WhatsApp (CTWA) Ad click lead arrival.");
    switchView('merchant');
    switchMerchantSection('inbox');
    setTimeout(() => {
      if (typeof simulateIncomingAdLead === 'function') {
        simulateIncomingAdLead();
      }
    }, 500);
  }
}

