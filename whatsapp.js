/* ==========================================
   ZANJI WHATSAPP SIMULATOR ENGINE
   ========================================== */

function initWhatsApp() {
  renderWaMessages();
  renderWaChips();
}

// Render message logs inside WhatsApp body
function renderWaMessages() {
  const chatBody = document.getElementById('wa-chat-body');
  if (!chatBody) return;

  chatBody.innerHTML = '';
  
  ZanjiState.simulator.messages.forEach(msg => {
    const isSentByMerchant = msg.sender === 'merchant';
    const isSystem = msg.sender === 'system';
    
    // Create bubble container
    const msgBubble = document.createElement('div');
    if (isSystem) {
      msgBubble.className = 'wa-message system';
    } else {
      msgBubble.className = `wa-message ${isSentByMerchant ? 'received' : 'sent'}`;
    }
    
    // Replace markdown bold (*text*) with <strong>
    let formattedText = msg.text
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
      
    if (msg.voice) {
      msgBubble.innerHTML = `
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
          Transcription: "${msg.text}"
        </div>
      `;
    } else {
      let referralHtml = '';
      if (msg.referral) {
        const thumb = msg.referral.mediaUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100&q=80';
        referralHtml = `
          <div style="background: rgba(0,0,0,0.25); border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; display: flex; gap: 8px; border-left: 3px solid var(--accent-primary); font-size: 0.75rem; text-align: left; min-width: 180px;">
            <img src="${thumb}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="overflow: hidden; flex: 1;">
              <div style="font-weight: bold; color: var(--accent-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Ad: ${msg.referral.campaignName || 'Special Offer'}</div>
              <div style="color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${msg.referral.headline || ''}</div>
            </div>
          </div>
        `;
      }
      msgBubble.innerHTML = `<div>${referralHtml}${formattedText}</div>`;
    }
    
    // Render interactive cards if any
    if (msg.interactive) {
      if (msg.interactive.type === 'catalog_btn') {
        const btnCard = document.createElement('div');
        btnCard.className = 'wa-catalog-card';
        btnCard.innerHTML = `
          <div class="wa-card-details">
            <div class="wa-card-title">${ZanjiState.storeName}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Click to view catalog items and make an order.</div>
          </div>
          <button class="wa-card-btn" onclick="switchView('storefront')">
            <i data-lucide="shopping-bag" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i> ${msg.interactive.label}
          </button>
        `;
        msgBubble.appendChild(btnCard);
      } 
      else if (msg.interactive.type === 'checkout_btn') {
        const chkCard = document.createElement('div');
        chkCard.className = 'wa-catalog-card';
        chkCard.innerHTML = `
          <div class="wa-card-details">
            <div class="wa-card-title">Secured Checkout Link</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Total: ${msg.interactive.totalPrice}</div>
          </div>
          <button class="wa-card-btn" onclick="openDirectCheckoutFromWa()">
            <i data-lucide="credit-card" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i> ${msg.interactive.label}
          </button>
        `;
        msgBubble.appendChild(chkCard);
      }
      else if (msg.interactive.type === 'tracking_btn') {
        const trackCard = document.createElement('div');
        trackCard.className = 'wa-catalog-card';
        trackCard.innerHTML = `
          <div class="wa-card-details">
            <div class="wa-card-title">${msg.interactive.carrier} Tracking</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Order Status updated to: *${msg.interactive.status}*</div>
          </div>
          <a class="wa-card-btn" href="#" onclick="alert('Redirecting to simulated ${msg.interactive.carrier} Portal tracking ID: ${msg.interactive.trackingId}')">
            <i data-lucide="truck" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i> Track Package (${msg.interactive.trackingId})
          </a>
        `;
        msgBubble.appendChild(trackCard);
      }
      else if (msg.interactive.type === 'auth_link_btn') {
        const authCard = document.createElement('div');
        authCard.className = 'wa-catalog-card';
        authCard.innerHTML = `
          <div class="wa-card-details">
            <div class="wa-card-title">Access Storefront</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Click the action below to finalize token authentication.</div>
          </div>
          <button class="wa-card-btn" onclick="executeWaAuthLink()">
            <i data-lucide="key-round" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i> ${msg.interactive.label}
          </button>
        `;
        msgBubble.appendChild(authCard);
      }
    }
    
    // Add time element
    const timeSpan = document.createElement('span');
    timeSpan.className = 'wa-msg-time';
    timeSpan.innerText = msg.time;
    msgBubble.appendChild(timeSpan);
    
    chatBody.appendChild(msgBubble);
  });
  
  // Scroll to bottom
  chatBody.scrollTop = chatBody.scrollHeight;
  lucide.createIcons();
}

// Render chip actions above input
function renderWaChips() {
  const chipContainer = document.getElementById('wa-suggestion-chips');
  if (!chipContainer) return;
  
  chipContainer.innerHTML = '';
  
  ZanjiState.simulator.suggestions.forEach(chipText => {
    const chip = document.createElement('button');
    chip.className = 'wa-chip';
    
    let displayLabel = chipText;
    if (chipText === 'sim recovery alert') displayLabel = '⚡ Sim Cart Recovery';
    if (chipText === 'my order status') displayLabel = '📦 Order Status';
    if (chipText === 'menu') displayLabel = '🛍️ Catalog Menu';
    
    chip.innerText = displayLabel;
    chip.onclick = () => sendWaSuggestion(chipText);
    chipContainer.appendChild(chip);
  });
}

// Send message via suggestions
function sendWaSuggestion(text) {
  appendWaMessage('customer', text);
  processBotReply(text);
}

// Send customer text input message
function sendWaCustomerMessage() {
  const inputEl = document.getElementById('wa-chat-input');
  if (!inputEl) return;
  
  const text = inputEl.value.trim();
  if (text === '') return;
  
  inputEl.value = '';
  appendWaMessage('customer', text);
  processBotReply(text);
}

function handleWaInputKey(event) {
  if (event.key === 'Enter') {
    sendWaCustomerMessage();
  }
}

// Helper to push message and force render
function appendWaMessage(sender, text, interactive = null) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  ZanjiState.simulator.messages.push({
    sender,
    text,
    time,
    interactive
  });
  
  renderWaMessages();
}

// Language Resource Mappings (Google-inspired phonetics & script cleaner)
function normalizeChatInput(text) {
  let cleaned = text.toLowerCase().trim();
  
  // Romanized Urdu / Hindi normalizations
  cleaned = cleaned.replace(/\b(acha|achha|achcha|accha)\b/g, 'ok');
  cleaned = cleaned.replace(/\b(shukria|shukriya|shukriaa)\b/g, 'thanks');
  cleaned = cleaned.replace(/\b(mjhe|mujhe|mujhaye)\b/g, 'me');
  cleaned = cleaned.replace(/\b(kro|karo|karna|karein)\b/g, 'do');
  cleaned = cleaned.replace(/\b(kasay|kese|kaise)\b/g, 'how');
  cleaned = cleaned.replace(/\b(kahan|kidhar)\b/g, 'where');
  cleaned = cleaned.replace(/\b(salam|slm|asalam|assalam)\b/g, 'salam');
  cleaned = cleaned.replace(/\b(kia|kya|kiah)\b/g, 'what');
  cleaned = cleaned.replace(/\b(bhai|brother|bhae)\b/g, 'brother');
  
  // Indonesian/Javanese/Sundanese contractions
  cleaned = cleaned.replace(/\byg\b/g, 'yang');
  cleaned = cleaned.replace(/\bdgn\b/g, 'dengan');
  cleaned = cleaned.replace(/\bmau\b/g, 'ingin');
  cleaned = cleaned.replace(/\bkrg\b/g, 'kurang');
  cleaned = cleaned.replace(/\btos\b/g, 'sudah');
  cleaned = cleaned.replace(/\bnuhun\b/g, 'terima kasih');
  
  return cleaned;
}

function detectChatLanguage(rawText, normalizedText) {
  // 1. Script checks using Unicode ranges
  if (/[\u0600-\u06FF]/.test(rawText)) {
    if (/سلام|ہیلو|مینو|آرڈر|قیمت|شکریہ|درجہ/.test(rawText)) return 'ur';
    return 'ar'; // Default Arabic script
  }
  if (/[\u0980-\u09FF]/.test(rawText)) return 'bn'; // Bengali
  if (/[\u1000-\u109F]/.test(rawText)) return 'my'; // Burmese
  if (/[\u0D80-\u0DFF]/.test(rawText)) return 'si'; // Sinhala
  if (/[\u1780-\u17FF]/.test(rawText)) return 'km'; // Khmer
  if (/[\u0ED0-\u0EDF\u0E80-\u0EFF]/.test(rawText)) return 'lo'; // Lao
  if (/[\u0900-\u097F]/.test(rawText)) return 'ne'; // Nepali / Devanagari

  // 2. Keyword/Dialect checks
  const lowerRaw = rawText.toLowerCase();
  
  // Javanese
  if (/\b(sugeng|tumbas|matur|nuwun|opo|kowe|mangga)\b/i.test(lowerRaw)) return 'jv';
  // Sundanese
  if (/\b(wilujeng|nuhun|punten|tos|sabaraha|lebet)\b/i.test(lowerRaw)) return 'su';
  // Indonesian
  if (/\b(halo|selamat|pagi|siang|beli|pesan|kirim|bayar|kasih|terima)\b/i.test(lowerRaw)) return 'id';
  // Afrikaans
  if (/\b(hallo|goeie|dankie|bestel|koop|waentjie)\b/i.test(lowerRaw)) return 'af';
  // Zulu / Xhosa
  if (/\b(sawubona|molo|enkosi|ngiyabonga|yebo)\b/i.test(lowerRaw)) return 'zu';
  // Yoruba
  if (/\b(bawo|eku|oose|ese|ra|wole)\b/i.test(lowerRaw)) return 'yo';
  // Romanized Urdu
  if (/\b(salam|kia|kya|hal|acha|shukriya|shukria|bhai|kese|kahan|kro)\b/i.test(lowerRaw)) return 'ur';

  // Fallback to active UI language
  return ZanjiState.activeLanguage || 'en';
}

const ChatLocales = {
  en: {
    greet: "Welcome to *{storeName}*! 🌸\n\nBrowse catalog items, check status, or checkout instantly on WhatsApp. How can we help you today?",
    btn_catalog: "Browse Catalog",
    btn_payment: "Complete Secure Payment",
    catalog_title: "Here is our latest collection:",
    catalog_footer: "Click below to add items to your cart and checkout.",
    status_title: "We found your active customer details. Here is your tracking report:",
    status_none: "We couldn't find any active orders for your number. Type *menu* to browse our catalog.",
    status_order: "📦 *Order #{id}* status is *{status}* via {carrier}.\nTracking ID: *{tracking}*.\n\n",
    status_delivered: "✅ *Order #{id}* was successfully *DELIVERED*.\n\n",
    recovery: "Hey! 🌟 We saw you left the gorgeous *Khaddi Embroidered Shawl* in your cart. Get flat *10% OFF* today using code *ZANJI10* to complete your order."
  },
  ur: {
    greet: "وعلیکم السلام! *{storeName}* میں خوش آمدید 🌸۔\n\nواٹس ایپ پر کیٹلاگ دیکھیں، آرڈر ٹریک کریں، یا فوری چیک آؤٹ کریں۔ ہم آپ کی کیا مدد کر سکتے ہیں؟",
    btn_catalog: "کیٹلاگ دیکھیں",
    btn_payment: "محفوظ ادائیگی کریں",
    catalog_title: "ہمارا تازہ ترین کلیکشن درج ذیل ہے:",
    catalog_footer: "مصنوعات کو کارٹ میں شامل کرنے اور آرڈر دینے کے لیے نیچے کلک کریں۔",
    status_title: "ہمیں آپ کے آرڈر کی تفصیلات مل گئی ہیں۔ آپ کی ٹریکنگ رپورٹ درج ذیل ہے:",
    status_none: "ہمیں آپ کے نمبر پر کوئی فعال آرڈر نہیں ملا۔ مصنوعات دیکھنے کے لیے *menu* ٹائپ کریں۔",
    status_order: "📦 *آرڈر #{id}* کی صورتحال: *{status}* بذریعہ {carrier}۔\nٹریکنگ نمبر: *{tracking}*۔\n\n",
    status_delivered: "✅ *آرڈر #{id}* کامیابی کے ساتھ *ڈیلیور* ہو چکا ہے۔\n\n",
    recovery: "پیارے کسٹمر! 🌟 ہم نے دیکھا کہ آپ نے اپنی کارٹ میں خوبصورت *کڑھائی والی شال* چھوڑی ہے۔ آرڈر مکمل کرنے کے لیے آج کوڈ *ZANJI10* استعمال کریں اور فلیٹ *10٪ ڈسکاؤنٹ* حاصل کریں۔"
  },
  ar: {
    greet: "مرحبًا بك في *{storeName}*! 🌸\n\nتصفح الكتالوج، وتتبع حالة طلبك، أو اتمم الدفع بأمان هنا على واتساب. كيف يمكننا مساعدتك اليوم؟",
    btn_catalog: "تصفح الكتالوج",
    btn_payment: "إتمام الدفع الآمن",
    catalog_title: "إليك مجموعتنا الأخيرة المتاحة للتوصيل:",
    catalog_footer: "انقر أدناه لإضافة المنتجات إلى السلة وإتمام الطلب.",
    status_title: "لقد عثرنا على تفاصيل طلبك. إليك تقرير التتبع:",
    status_none: "لم نجد أي طلبات نشطة مرتبطة برقمك. اكتب *menu* لتصفح الكتالوج المتاح.",
    status_order: "📦 *الطلب رقم #{id}* حالته الحالية: *{status}* عبر {carrier}.\nرقم التتبع: *{tracking}*.\n\n",
    status_delivered: "✅ *الطلب رقم #{id}* تم *توصيله* بنجاح.\n\n",
    recovery: "أهلاً بك! 🌟 لاحظنا أنك تركت منتج *شال خادي مطرز* في سلتك. استخدم الكود *ZANJI10* اليوم للحصول على خصم *10%* وإتمام طلبك."
  },
  id: {
    greet: "Selamat Datang di *{storeName}*! 🌸\n\nJelajahi katalog kami, cek status pesanan, atau selesaikan pembayaran langsung di WhatsApp. Ada yang bisa kami bantu?",
    btn_catalog: "Jelajahi Katalog",
    btn_payment: "Selesaikan Pembayaran",
    catalog_title: "Berikut adalah koleksi produk terbaru kami:",
    catalog_footer: "Klik tombol di bawah ini untuk memesan dan checkout.",
    status_title: "Kami menemukan detail pesanan Anda. Berikut laporan pelacakan pengiriman Anda:",
    status_none: "Kami tidak menemukan pesanan aktif untuk nomor Anda. Ketik *menu* untuk melihat katalog kami.",
    status_order: "📦 *Pesanan #{id}* statusnya adalah *{status}* melalui {carrier}.\nNomor Resi: *{tracking}*.\n\n",
    status_delivered: "✅ *Pesanan #{id}* telah berhasil *DITERIMA*.\n\n",
    recovery: "Halo! 🌟 Kami melihat Anda meninggalkan *Syal Bordir Khaddi* di keranjang belanja. Dapatkan *DISKON 10%* hari ini dengan kode *ZANJI10* untuk menyelesaikan pesanan Anda."
  },
  bn: {
    greet: "আপনাকে স্বাগতম *{storeName}* এ! 🌸\n\nহোয়াটসঅ্যাপে আমাদের ক্যাটালগ দেখুন, অর্ডার ট্র্যাক করুন বা পেমেন্ট সম্পন্ন করুন। আজ আমরা কীভাবে আপনাকে সাহায্য করতে পারি?",
    btn_catalog: "ক্যাটালগ ব্রাউজ করুন",
    btn_payment: "পেমেন্ট সম্পন্ন করুন",
    catalog_title: "এখানে আমাদের সর্বশেষ সংগ্রহ দেওয়া হলো:",
    catalog_footer: "কার্টে পণ্য যুক্ত করতে এবং চেকআউট করতে নিচে ক্লিক করুন।",
    status_title: "আমরা আপনার অর্ডারের বিবরণী পেয়েছি। এখানে আপনার ট্র্যাকিং রিপোর্ট দেওয়া হলো:",
    status_none: "আপনার নম্বরের সাথে যুক্ত কোনো একটিভ অর্ডার পাওয়া যায়নি। ক্যাটালগ দেখতে *menu* লিখুন।",
    status_order: "📦 *অর্ডার #{id}* এর বর্তমান অবস্থা *{status}* (ক্যারিয়ার: {carrier})।\nট্র্যাকিং নম্বর: *{tracking}*।\n\n",
    status_delivered: "✅ *অর্ডার #{id}* সফলভাবে *ডেলিভারি সম্পন্ন* হয়েছে।\n\n",
    recovery: "হ্যালো! 🌟 আমরা দেখেছি আপনি আপনার কার্টে চমৎকার *খাদি এমব্রয়ডারি শাল*টি রেখে গেছেন। আপনার অর্ডারটি সম্পূর্ণ করতে আজই ব্যবহার করুন কোড *ZANJI10* এবং পান ফ্ল্যাট *১০% ছাড়*।"
  },
  jv: {
    greet: "Sugeng rawuh ing *{storeName}*! 🌸\n\nDeleng katalog barang, cek status pesanan, utawa bayar langsung ing kene. Wonten sing saged kula bantu?",
    btn_catalog: "Deleng Katalog",
    btn_payment: "Bayar Saiki",
    catalog_title: "Iki koleksi barang paling anyar saka toko kami:",
    catalog_footer: "Klik tombol ing ngisor iki kanggo nambah barang lan pesen.",
    status_title: "Data pesenan sampeyan wis ketemu. Iki rincian pelacakan kiriman:",
    status_none: "Nomer sampeyan durung duwe pesenan aktif. Ketik *menu* kanggo ndeleng katalog.",
    status_order: "📦 *Pesenan #{id}* statuse *{status}* liwat {carrier}.\nNomer Resi: *{tracking}*.\n\n",
    status_delivered: "✅ *Pesenan #{id}* wis sukses *DITAMPA*.\n\n",
    recovery: "Halo! 🌟 Kranjang blanja sampeyan isih nyimpen *Syal Sulam Khaddi*. Gunakake kode *ZANJI10* kanggo entuk *DISKON 10%* dina iki."
  },
  su: {
    greet: "Wilujeng sumping di *{storeName}*! 🌸\n\nMangga tingal katalog barang, cek status pesenan, atanapi bayar langsung di dieu. Aya anu tiasa dibantu?",
    btn_catalog: "Tinggal Katalog",
    btn_payment: "Bayar Ayeuna",
    catalog_title: "Ieu koleksi barang panganyarna ti toko kami:",
    catalog_footer: "Klik tombol di handap ieu kanggo mesen sareng checkout.",
    status_title: "Data pesenan anjeun parantos kapendak. Ieu rincian pelacakan kiriman:",
    status_none: "Nomer anjeun teu acan gaduh pesenan anu aktip. Serat *menu* kanggo ningal katalog.",
    status_order: "📦 *Pesenan #{id}* statusna *{status}* liwat {carrier}.\nNomer Resi: *{tracking}*.\n\n",
    status_delivered: "✅ *Pesenan #{id}* tos sukses *KATAMPI*.\n\n",
    recovery: "Halo! 🌟 Wadah balanja anjeun masih nyimpen *Syal Sulam Khaddi*. Anggo kode *ZANJI10* kanggo kéngingkeun *DISKON 10%* dinten ieu."
  },
  km: {
    greet: "សូមស្វាគមន៍មកកាន់ *{storeName}*! 🌸\n\nមើលកាតាឡុកផលិតផល ពិនិត្យស្ថានភាពការបញ្ជាទិញ ឬទូទាត់ប្រាក់ភ្លាមៗតាម WhatsApp។ តើយើងអាចជួយអ្វីខ្លះដល់អ្នកនៅថ្ងៃនេះ?",
    btn_catalog: "មើលកាតាឡុក",
    btn_payment: "ទូទាត់ប្រាក់ឥឡូវនេះ",
    catalog_title: "នេះជាការប្រមូលផ្តុំផលិតផលចុងក្រោយបំផុតរបស់យើង៖",
    catalog_footer: "ចុចខាងក្រោមដើម្បីបន្ថែមផលិតផលទៅក្នុងកន្ត្រក និងទូទាត់ប្រាក់។",
    status_title: "យើងបានរកឃើញព័ត៌មានការបញ្ជាទិញរបស់អ្នក។ នេះជារបាយការណ៍ដឹកជញ្ជូនរបស់អ្នក៖",
    status_none: "យើងរកមិនឃើញការបញ្ជាទិញណាមួយសម្រាប់លេខរបស់អ្នកទេ។ វាយពាក្យ *menu* ដើម្បីមើលកាតាឡុក។",
    status_order: "📦 *ការបញ្ជាទិញ #{id}* ស្ថានភាពគឺ *{status}* តាមរយៈ {carrier}។\nលេខផ្លាកដឹក៖ *{tracking}*។\n\n",
    status_delivered: "✅ *ការបញ្ជាទិញ #{id}* ត្រូវបាន *ដឹកជញ្ជូនរួចរាល់*។\n\n",
    recovery: "សួស្តី! 🌟 យើងឃើញថាអ្នកបានបន្សល់ទុក *ស្បៃប៉ាក់ Khaddi* នៅក្នុងកន្ត្រករបស់អ្នក។ ប្រើកូដ *ZANJI10* ថ្ងៃនេះដើម្បីទទួលបានការបញ្ចុះតម្លៃ *10%*។"
  },
  lo: {
    greet: "ຍິນດີຕ້ອນຮັບເຂົ້າສູ່ຮ້ານ *{storeName}*! 🌸\n\nເບິ່ງລາຍການສິນຄ້າ, ຕິດຕາມສະຖານະການສັ່ງຊື້, ຫຼືຊຳລະເງິນຢ່າງປອດໄພໃນ WhatsApp. ມີຫຍັງໃຫ້ພວກເຮົາຊ່ວຍເຫຼືອທ່ານໃນມື້ນີ້?",
    btn_catalog: "ເບິ່ງລາຍການສິນຄ້າ",
    btn_payment: "ຊຳລະເງິນຕອນນີ້",
    catalog_title: "ນີ້ແມ່ນລາຍການສິນຄ້າມາໃໝ່ຫຼ້າສຸດຂອງພວກເຮົາ:",
    catalog_footer: "ຄລິກປຸ່ມດ້ານລຸ່ມເພື່ອເພີ່ມສິນຄ້າໃສ່ກະຕ່າ ແລະສັ່ງຊື້.",
    status_title: "ພວກເຮົາພົບຂໍ້ມູນການສັ່ງຊື້ຂອງທ່ານແລ້ວ. ນີ້ແມ່ນລາຍລະອຽດການຕິດຕາມສິນຄ້າ:",
    status_none: "ພວກເຮົາບໍ່ພົບການສັ່ງຊື້ໃດໆສໍາລັບເບີຂອງທ່ານ. ພິມ *menu* ເພື່ອເບິ່ງສິນຄ້າ.",
    status_order: "📦 *ການສັ່ງຊື້ #{id}* ສະຖານະແມ່ນ *{status}* ຜ່ານ {carrier}.\nເລກຕິດຕາມ: *{tracking}*.\n\n",
    status_delivered: "✅ *ການສັ່ງຊື້ #{id}* ໄດ້ຮັບການ *ຈັດສົ່ງສໍາເລັດ*.\n\n",
    recovery: "ສະບາຍດີ! 🌟 ພວກເຮົາເຫັນວ່າທ່ານປະສິນຄ້າ *ຜ້າພັນຄໍປັກແສ່ວ Khaddi* ໄວ້ໃນກະຕ່າ. ໃຊ້ລະຫັດ *ZANJI10* ມື້ນີ້ເພື່ອຮັບສ່ວນຫຼຸດ *10%*."
  },
  my: {
    greet: "*{storeName}* မှ ကြိုဆိုပါသည်! 🌸\n\nWhatsApp တွင် ကုန်ပစ္စည်းများ ကြည့်ရှုရန်၊ အော်ဒါအခြေအနေ စစ်ဆေးရန် သို့မဟုတ် ချက်ချင်း ဝယ်ယူရန် ဆောင်ရွက်နိုင်ပါသည်။ ဘာများ ကူညီပေးရမလဲခင်ဗျာ။",
    btn_catalog: "ကုန်ပစ္စည်းများ ကြည့်ရန်",
    btn_payment: "ငွေပေးချေရန်",
    catalog_title: "ဒါကတော့ ကျွန်တော်တို့ဆိုင်ရဲ့ နောက်ဆုံးပေါ် စုဆောင်းမှုပဲ ဖြစ်ပါတယ် -",
    catalog_footer: "ခြင်းတောင်းထဲ ပစ္စည်းထည့်ပြီး ဈေးဝယ်ရန် အောက်ပါအတိုင်း နှိပ်ပါ။",
    status_title: "သင့်အော်ဒါအချက်အလက်ကို တွေ့ရှိပါသည်။ ပို့ဆောင်ရေး အခြေအနေမှာ အောက်ပါအတိုင်း ဖြစ်ပါသည် -",
    status_none: "သင့်ဖုန်းနံပါတ်ဖြင့် မှာယူထားသည့် အော်ဒါမရှိသေးပါ။ ကုန်ပစ္စည်းများ ကြည့်ရှုရန် *menu* ဟု ရိုက်ထည့်ပါ။",
    status_order: "📦 *အော်ဒါနံပါတ် #{id}* အခြေအနေမှာ *{status}* ဖြစ်ပြီး {carrier} ဖြင့် ပို့ဆောင်နေပါသည်။\nခြေရာခံနံပါတ် - *{tracking}*\n\n",
    status_delivered: "✅ *အော်ဒါနံပါတ် #{id}* အောင်မြင်စွာ *ပို့ဆောင်ပြီးပါပြီ*။\n\n",
    recovery: "မင်္ဂလာပါ 🌟 သင့်ဈေးဝယ်ခြင်းတောင်းထဲတွင် *Khaddi ချည်ထိုးခြုံစောင်* ကျန်ရှိနေသည်ကို တွေ့ရပါသည်။ ယနေ့ဝယ်ယူပါက ကုဒ် *ZANJI10* သုံးပြီး *၁၀% လျှော့စျေး* ရယူလိုက်ပါ။"
  },
  ne: {
    greet: "*{storeName}* मा स्वागत छ! 🌸\n\nव्हाट्सएपमा हाम्रो सूची क्याटलग हेर्नुहोस्, अर्डरको अवस्था ट्र्याक गर्नुहोस्, वा सिधै भुक्तानी गर्नुहोस्। आज हामी तपाईंलाई के सहयोग गरौं?",
    btn_catalog: "सूची ब्राउज गर्नुहोस्",
    btn_payment: "भुक्तानी पूरा गर्नुहोस्",
    catalog_title: "यहाँ हाम्रो पछिल्लो उत्कृष्ट संग्रहको सूची छ:",
    catalog_footer: "सामान कार्टमा थप्न र भुक्तानी गर्न तल क्लिक गर्नुहोस्।",
    status_title: "हामीले तपाईंको अर्डरको विवरण फेला पारेका छौं। डेलिभरी रिपोर्ट यस प्रकार छ:",
    status_none: "तपाईंको नम्बरमा कुनै सक्रिय अर्डर फेला परेन। क्याटलग हेर्न *menu* टाइप गर्नुहोस्।",
    status_order: "📦 *अर्डर #{id}* को स्थिति *{status}* छ ({carrier} मार्फत)।\nट्र्याकिङ नम्बर: *{tracking}*\n\n",
    status_delivered: "✅ *अर्डर #{id}* सफलतापूर्वक *डेलिभर* भइसकेको छ।\n\n",
    recovery: "नमस्ते! 🌟 तपाईंले कार्टमा सुन्दर *खद्दर कढाई गरिएको शल* छोड्नुभएको देखिन्छ। अर्डर पूरा गर्न आजै कोड *ZANJI10* प्रयोग गरी *१०% छुट* पाउनुहोस्।"
  },
  si: {
    greet: "*{storeName}* වෙත සාදරයෙන් පිළිගනිමු! 🌸\n\nභාණ්ඩ නාමාවලිය බලන්න, ඇණවුම් සොයා යන්න, හෝ WhatsApp හරහා ගෙවීම් කරන්න. අද දින ඔබට කෙසේ උදව් විය යුතුද?",
    btn_catalog: "නාමාවලිය බලන්න",
    btn_payment: "ගෙවීම් සම්පූර්ණ කරන්න",
    catalog_title: "අපගේ නවතම එකතුව මෙසේය:",
    catalog_footer: "කරත්තයට එකතු කර ඇණවුම් කිරීමට පහතින් ක්ලික් කරන්න.",
    status_title: "ඔබගේ ඇණවුම් තොරතුරු හමු විය. ඇණවුම් ප්‍රවාහන තත්ත්වය මෙසේය:",
    status_none: "ඔබගේ දුරකථන අංකයට සක්‍රීය ඇණවුම් කිසිවක් හමු නොවිණි. නාමාවලිය බලන්න *menu* ලෙස එවන්න.",
    status_order: "📦 *ඇණවුම් අංක #{id}* දැනට *{status}* මට්ටමේ පවතී (ප්‍රවාහනය: {carrier}).\nෙසොයායෑම් අංකය: *{tracking}*.\n\n",
    status_delivered: "✅ *ඇණවුම් අංක #{id}* සාර්ථකව *ලැබී ඇත*.\n\n",
    recovery: "ආයුබෝවන්! 🌟 ඔබගේ සාප්පු කරත්තයේ *කද්දි ෂෝල්* එකක් ඉතිරි වී ඇති බව පෙනේ. ඇණවුම සම්පූර්ණ කිරීමට අදම *ZANJI10* කේතය භාවිත කර *10% ක වට්ටමක්* ලබා ගන්න."
  },
  af: {
    greet: "Welkom by *{storeName}*! 🌸\n\nBlaai deur katalogusitems, kontroleer status of betaal onmiddellik op WhatsApp. Hoe kan ons jou vandag help?",
    btn_catalog: "Blaai Katalogus",
    btn_payment: "Voltooi Betaling",
    catalog_title: "Hier is ons nuutste versameling:",
    catalog_footer: "Klik hieronder om items by die waentjie te voeg en te betaal.",
    status_title: "Ons het jou bestellingsbesonderhede gevind. Hier is jou afleweringsverslag:",
    status_none: "Geen aktiewe bestellings vir jou nommer gevind nie. Tik *menu* om ons katalogus te bekyk.",
    status_order: "📦 *Bestelling #{id}* status is *{status}* via {carrier}.\nNaspoor ID: *{tracking}*.\n\n",
    status_delivered: "✅ *Bestelling #{id}* is suksesvol *AFGELEWER*.\n\n",
    recovery: "Hallo! 🌟 Ons sien jy het die pragtige *Khaddi Geborduurde Sjaal* in jou waentjie gelaat. Gebruik kode *ZANJI10* vandag vir *10% AF* om te voltooi."
  },
  xh: {
    greet: "Wamkelekile ku-*{storeName}*! 🌸\n\nJonga iikhatalogu, landa ubume be-odolo, okanye uhlawule apha ku-WhatsApp. Sing akunceda ngantoni namhlanje?",
    btn_catalog: "Khangela iKhathalogu",
    btn_payment: "Gqibezela iNtlawulo",
    catalog_title: "Nantsi ingqokelela yethu yakutsha nje:",
    catalog_footer: "Cofa ngezantsi ukufaka izinto enqoleni uze uhlawule.",
    status_title: "Sizifumene iinkcukacha zakho ze-odolo. Nantsi ingxelo yokulandela umkhondo:",
    status_none: "Sikufumene odolo esebenzayo kule nombolo. Bhala *menu* ukujonga iimveliso zethu.",
    status_order: "📦 *I-Odolo #{id}* ikwimo ye-*{status}* nge-{carrier}.\nInombolo yomkhondo: *{tracking}*.\n\n",
    status_delivered: "✅ *I-Odolo #{id}* izisiwe ngempumelelo.\n\n",
    recovery: "Molo! 🌟 Siphaphele ukuba ushiye i-*Khaddi Geborduurde Sjaal* enqoleni yakho. Sebenzisa ikhowudi *ZANJI10* namhlanje ufumane isaphulelo se-*10% OFF*."
  },
  zu: {
    greet: "Siyakwamukela ku-*{storeName}*! 🌸\n\nPhequlula ikhathalogi, hlola isimo se-ododa, noma ukhokhe lapha ku-WhatsApp. Singakusiza ngani namhlanje?",
    btn_catalog: "Phequlula Ikhathalogi",
    btn_payment: "Qedela Ukukhokha",
    catalog_title: "Nansi ikhathalogi yethu entsha:",
    catalog_footer: "Cofa ngezansi ukuze ungeze izinto enqoleni bese ukhokha.",
    status_title: "Siyitholile imininingwane ye-ododa yakho. Nansi imininingwane yokulandelela:",
    status_none: "Ayikho i-ododa esebenzayo kule nombolo. Bhala *menu* ukuze ubone imikhiqizo yethu.",
    status_order: "📦 *I-Ododa #{id}* ikwimo ye-*{status}* nge-{carrier}.\nInombolo yokulandelela: *{tracking}*.\n\n",
    status_delivered: "✅ *I-Ododa #{id}* ilethwe ngempumelelo.\n\n",
    recovery: "Sawubona! 🌟 Siphawule ukuthi ushiye i-*Khaddi Geborduurde Sjaal* enqoleni yakho. Sebenzisa ikhodi *ZANJI10* namhlanje uthole isaphulelo sika-*10% OFF*."
  },
  yo: {
    greet: "Kaabo si *{storeName}*! 🌸\n\nKiri katalogi, ṣayẹwo ipo aṣẹ, tabi sanwo taara lori WhatsApp. Bawo ni a ṣe le ràn ọ lọwọ loni?",
    btn_catalog: "Kiri Katalogi",
    btn_payment: "Pari Isanwo",
    catalog_title: "Eyi ni akojọpọ tuntun wa fun ọ:",
    catalog_footer: "Tẹ bọtini ni isalẹ lati fi awọn nkan kun kẹkẹ ki o sanwo.",
    status_title: "A rii awọn alaye aṣẹ rẹ. Eyi ni ijabọ titele rẹ:",
    status_none: "A ko rii awọn aṣẹ eyikeyi fun nọmba rẹ. Tẹ *menu* lati wo katalogi wa.",
    status_order: "📦 *Aṣẹ #{id}* wa ni ipo *{status}* nipasẹ {carrier}.\nNọmba titele: *{tracking}*.\n\n",
    status_delivered: "✅ *Aṣẹ #{id}* ti ni ifijiṣẹ ni aṣeyọri.\n\n",
    recovery: "Pẹlẹ o! 🌟 A rii pe o fi *Khaddi Geborduurde Sjaal* silẹ ninu kẹkẹ rẹ. Lo koodu *ZANJI10* loni lati gba *10% OFF*."
  }
};

// Core Chatbot automation simulation
function processBotReply(customerText) {
  const rawQuery = customerText.trim();
  const normalizedQuery = normalizeChatInput(rawQuery);
  const detectedLang = detectChatLanguage(rawQuery, normalizedQuery);
  
  // Update state language to match the detected customer language!
  ZanjiState.activeLanguage = detectedLang;
  
  // Show a typing indicator block
  const chatBody = document.getElementById('wa-chat-body');
  const typingBubble = document.createElement('div');
  typingBubble.className = 'wa-message received typing-bubble';
  typingBubble.innerHTML = '<div style="display:flex; gap: 4px; padding: 4px 8px;"><span class="dot" style="animation: typingDot 1s infinite">.</span><span class="dot" style="animation: typingDot 1s infinite 0.2s">.</span><span class="dot" style="animation: typingDot 1s infinite 0.4s">.</span></div>';
  chatBody.appendChild(typingBubble);
  chatBody.scrollTop = chatBody.scrollHeight;
  
  // Custom stylesheet additions for typing indicator dots animation
  if (!document.getElementById('wa-typing-styles')) {
    const style = document.createElement('style');
    style.id = 'wa-typing-styles';
    style.innerHTML = `
      @keyframes typingDot { 0% { opacity: .2; } 50% { opacity: 1; } 100% { opacity: .2; } }
      .typing-bubble { border-radius: 8px !important; border-top-left-radius: 0 !important; width: 60px; text-align: center; }
    `;
    document.head.appendChild(style);
  }

  const currentConfig = RegionConfigs[ZanjiState.currentRegion];
  const loc = ChatLocales[detectedLang] || ChatLocales.en;

  setTimeout(() => {
    // Remove typing bubble
    typingBubble.remove();
    
    // Check intents based on normalized and raw inputs
    const isHello = normalizedQuery.includes('hi') || normalizedQuery.includes('hello') || normalizedQuery.includes('salam') || 
                    /\b(hey|halo|molo|sawubona|bawo|sugeng|wilujeng)\b/i.test(normalizedQuery) ||
                    /سلام|ہیلو|مرحبا/.test(rawQuery);
                    
    const isMenu = normalizedQuery.includes('menu') || normalizedQuery.includes('catalog') || normalizedQuery.includes('buy') || normalizedQuery.includes('shop') ||
                   /\b(tumbas|toko|katalog|menu|ra|koop)\b/i.test(normalizedQuery) ||
                   /مینو|کیٹلاگ|قائمة/.test(rawQuery);
                   
    const isStatus = normalizedQuery.includes('status') || normalizedQuery.includes('order') || normalizedQuery.includes('track') ||
                     /\b(kirim|resi|lacak|odolo|ododa|bestel)\b/i.test(normalizedQuery) ||
                     /ٹریک|حیثیت|تفصیل/.test(rawQuery);
                     
    const isRecovery = normalizedQuery.includes('sim recovery') || normalizedQuery.includes('recovery alert') || normalizedQuery.includes('abandoned');

    if (isHello) {
      appendWaMessage('merchant', 
        loc.greet.replace('{storeName}', ZanjiState.storeName),
        { type: 'catalog_btn', label: loc.btn_catalog }
      );
    } 
    else if (isMenu) {
      // Build order item list dynamically using converted regional prices
      let itemsText = `${loc.catalog_title}\n\n`;
      ZanjiState.products.forEach((p, idx) => {
        const localPrice = Math.round(p.price * currentConfig.rate);
        itemsText += `${idx + 1}. *${p.title}* - ${currentConfig.symbol} ${localPrice.toLocaleString()}\n`;
      });
      itemsText += `\n${loc.catalog_footer}`;

      appendWaMessage('merchant', itemsText, { type: 'catalog_btn', label: loc.btn_catalog });
    } 
    else if (isStatus) {
      // Find active simulation orders
      const pendingOrders = ZanjiState.orders.filter(o => o.status === 'pending');
      const shipped = ZanjiState.orders.find(o => o.status === 'shipped');
      const delivered = ZanjiState.orders.find(o => o.status === 'delivered');
      
      let replyText = `${loc.status_title}\n\n`;
      let orderFound = false;
      
      if (shipped) {
        orderFound = true;
        replyText += loc.status_order
          .replace('{id}', shipped.id)
          .replace('{status}', shipped.status.toUpperCase())
          .replace('{carrier}', shipped.logistics)
          .replace('{tracking}', shipped.trackingNumber);
      }
      if (delivered) {
        orderFound = true;
        replyText += loc.status_delivered.replace('{id}', delivered.id);
      }
      if (pendingOrders.length > 0) {
        orderFound = true;
        pendingOrders.forEach(po => {
          replyText += `⏳ *Order #${po.id}* status is *PENDING* review.\n\n`;
        });
      }
      
      if (!orderFound) {
        replyText = loc.status_none;
      }
      
      appendWaMessage('merchant', replyText, shipped ? {
        type: 'tracking_btn',
        carrier: shipped.logistics,
        status: shipped.status,
        trackingId: shipped.trackingNumber
      } : null);
    } 
    else if (isRecovery) {
      const shawl = ZanjiState.products.find(p => p.id === 2);
      const convertedPrice = Math.round(shawl.price * 0.9 * currentConfig.rate); // 10% off
      
      appendWaMessage('merchant', 
        loc.recovery,
        { type: 'checkout_btn', label: loc.btn_payment, totalPrice: `${currentConfig.symbol} ${convertedPrice.toLocaleString()}` }
      );
    }
    else {
      // Default fallback
      const defaultNotice = detectedLang === 'ur' ? 
        `چیٹ کرنے کا شکریہ! مصنوعات کی فہرست دیکھنے کے لیے براہ کرم *menu* لکھیں، یا آرڈر ٹریک کرنے کے لیے *status* لکھیں۔` :
        `Thank you for messaging *${ZanjiState.storeName}*.\n\nPlease type *menu* to browse our catalog, or type *status* to track your shipments.`;
        
      appendWaMessage('merchant', defaultNotice);
    }
  }, 1000);
}

// Force opens checkout view and fills customer cart with mock item (Abandoned Cart recovery link clicked)
function openDirectCheckoutFromWa() {
  switchView('storefront');
  
  // Set cart to Khaddi Shawl
  const shawl = ZanjiState.products.find(p => p.id === 2);
  ZanjiState.cart = [{ product: shawl, quantity: 1 }];
  
  // Rerender storefront
  initStorefront();
  
  // Navigate to checkout form directly
  renderCheckoutView();
}

// Executes magic-link auth from WhatsApp
function executeWaAuthLink() {
  ZanjiState.customerAuthenticated = true;
  switchView('storefront');
}

// Simulate customer recording a voice message on their phone
function startSimulatedVoiceRecording() {
  const inputEl = document.getElementById('wa-chat-input');
  const micBtn = document.getElementById('wa-mic-btn');
  if (!inputEl || !micBtn) return;

  // Toggle record animation
  inputEl.disabled = true;
  inputEl.placeholder = "Recording voice order message...";
  inputEl.style.color = "#ef4444";
  
  // Inject pulsing record dot visually in input bar
  const container = inputEl.parentNode;
  const pulseDot = document.createElement('span');
  pulseDot.className = 'recording-pulsing-dot';
  container.insertBefore(pulseDot, inputEl);

  micBtn.style.color = "#ef4444";
  micBtn.classList.add('recording');

  setTimeout(() => {
    // Stop recording, remove elements and restore
    inputEl.disabled = false;
    inputEl.placeholder = "Type a message...";
    inputEl.style.color = "";
    pulseDot.remove();
    micBtn.style.color = "#8696a0";
    micBtn.classList.remove('recording');

    // Define regional transcriptions and structured AI draft orders
    const regionTranscripts = {
      PK: {
        text: "Salaam! Mujhe ek Velvet Hand-Worked Khussa chahiye size 8 mein. Mera address Clifton Block 4, Sea Breeze Apt 5B Karachi hai.",
        lang: "ur",
        draft: {
          productId: 3, // Velvet Khussa
          productTitle: "Velvet Hand-Worked Khussa",
          quantity: 1,
          total: 1999, // base price
          customerName: ZanjiState.simulator.customerName,
          phone: ZanjiState.simulator.customerPhone,
          address: "Clifton Block 4, Sea Breeze Apt 5B",
          city: "Karachi"
        }
      },
      AE: {
        text: "Marhaban! I want to order 1 Silk Printed Dupatta. Please ship it to Marina Heights Tower, Flat 2402 Dubai.",
        lang: "ar",
        draft: {
          productId: 4, // Silk Dupatta
          productTitle: "Silk Printed Dupatta",
          quantity: 1,
          total: 1500, // base price
          customerName: ZanjiState.simulator.customerName,
          phone: ZanjiState.simulator.customerPhone,
          address: "Marina Heights Tower, Flat 2402",
          city: "Dubai"
        }
      },
      ID: {
        text: "Halo! Saya mau pesan satu Linen Block-Print Kurti. Alamat saya di Jalan Sudirman No. 45 Bandung.",
        lang: "id",
        draft: {
          productId: 1, // Linen Kurta
          productTitle: "Linen Block-Print Kurti",
          quantity: 1,
          total: 2450, // base price
          customerName: ZanjiState.simulator.customerName,
          phone: ZanjiState.simulator.customerPhone,
          address: "Jalan Sudirman No. 45",
          city: "Bandung"
        }
      },
      NG: {
        text: "Hello, please send one Khaddi Embroidered Shawl. Deliver it to 12 Broad Street, Lagos Island, Lagos.",
        lang: "yo",
        draft: {
          productId: 2, // Khaddi Shawl
          productTitle: "Khaddi Embroidered Shawl",
          quantity: 1,
          total: 4800, // base price
          customerName: ZanjiState.simulator.customerName,
          phone: ZanjiState.simulator.customerPhone,
          address: "12 Broad Street, Lagos Island",
          city: "Lagos"
        }
      },
      GL: {
        text: "Hello! I would like to purchase 1 Linen Block-Print Kurti. Delivery address is 100 Main Street, New York.",
        lang: "en",
        draft: {
          productId: 1, // Linen Kurta
          productTitle: "Linen Block-Print Kurti",
          quantity: 1,
          total: 2450, // base price
          customerName: ZanjiState.simulator.customerName,
          phone: ZanjiState.simulator.customerPhone,
          address: "100 Main Street",
          city: "New York"
        }
      }
    };

    const currentConfig = regionTranscripts[ZanjiState.currentRegion] || regionTranscripts.GL;
    
    // Append simulated voice note bubble
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    ZanjiState.simulator.messages.push({
      sender: 'customer',
      text: currentConfig.text,
      time,
      voice: true
    });

    renderWaMessages();

    // Set active voice draft globally
    ZanjiState.activeVoiceDraft = currentConfig.draft;

    // Chatbot auto-replies confirming receipt and merchant review
    setTimeout(() => {
      let botConfirmation = `I have received your voice order and created a draft invoice. 📝\n\n` +
                            `Our merchant will review it and send your WhatsApp checkout payment confirmation link shortly.`;
      
      if (ZanjiState.currentRegion === 'PK') {
        botConfirmation = `آپ کا صوتی آرڈر موصول ہو گیا ہے اور ڈرافٹ انוائس تیار کر لی گئی ہے۔ 📝\n\n` +
                          `ہمارا مرچنٹ جلد ہی اس کا جائزہ لے گا اور آپ کو واٹس ایپ چیک آؤٹ کا لنک بھیج دے گا۔`;
      } else if (ZanjiState.currentRegion === 'ID') {
        botConfirmation = `Pesanan suara Anda telah diterima dan draf faktur telah dibuat. 📝\n\n` +
                          `Penjual kami akan meninjau dan mengirimkan tautan konfirmasi pembayaran WhatsApp segera.`;
      }
      
      appendWaMessage('merchant', botConfirmation);
      
      // Update Merchant Inbox view in case it's active
      if (ZanjiState.activeMerchantSection === 'inbox') {
        renderMerchantInbox();
      }
    }, 1200);

  }, 2500);
}
