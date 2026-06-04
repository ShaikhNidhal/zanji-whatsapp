# Graph Report - .  (2026-06-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 71 nodes · 115 edges · 9 communities (8 shown, 1 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]

## God Nodes (most connected - your core abstractions)
1. `Zanji Merchant Portal & Storefront` - 11 edges
2. `initMerchant()` - 7 edges
3. `initStorefront()` - 7 edges
4. `appendWaMessage()` - 7 edges
5. `switchView()` - 5 edges
6. `changeGlobalRegion()` - 5 edges
7. `processBotReply()` - 5 edges
8. `closeModal()` - 4 edges
9. `renderMerchantDashboard()` - 4 edges
10. `handleNewProductSubmit()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Zanji Merchant Portal & Storefront` --references--> `Application Logic`  [INFERRED]
  index.html → app.js
- `Zanji Merchant Portal & Storefront` --references--> `Merchant Portal Logic`  [INFERRED]
  index.html → merchant.js
- `Zanji Merchant Portal & Storefront` --references--> `Customer Storefront Logic`  [INFERRED]
  index.html → storefront.js
- `Zanji Merchant Portal & Storefront` --references--> `WhatsApp Simulator Logic`  [INFERRED]
  index.html → whatsapp.js
- `simulateQrScan()` --calls--> `appendWaMessage()`  [INFERRED]
  storefront.js → whatsapp.js

## Import Cycles
- None detected.

## Communities (9 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (13): switchView(), addToStorefrontCart(), bypassLoginGate(), changeCartQty(), changeStorefrontLanguage(), initStorefront(), PaymentDetailsMap, renderCheckoutView() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.32
Nodes (11): appendWaMessage(), ChatLocales, detectChatLanguage(), handleWaInputKey(), initWhatsApp(), normalizeChatInput(), processBotReply(), renderWaChips() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (13): Application Logic, Catalog Manager Section, Zanji Merchant Portal & Storefront, Zanji Merchant Onboarding, Lucide Icons Library, Merchant Dashboard Section, Merchant Portal Logic, QR Code Generation API (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.36
Nodes (5): openModal(), calculateSegmentSize(), generateMockTracking(), openOrderOperations(), prefillBroadcast()

### Community 4 - "Community 4"
Cohesion: 0.40
Nodes (6): closeModal(), handleBroadcastSubmit(), handleNewProductSubmit(), initMerchant(), renderBroadcastHistory(), renderMerchantCatalog()

### Community 5 - "Community 5"
Cohesion: 0.50
Nodes (4): changeGlobalRegion(), detectRegionByIp(), RegionConfigs, ZanjiState

### Community 6 - "Community 6"
Cohesion: 0.40
Nodes (5): switchMerchantSection(), handleInboxInputKey(), renderMerchantInbox(), selectInboxThread(), sendInboxMerchantReply()

### Community 7 - "Community 7"
Cohesion: 0.50
Nodes (4): calculateAnalytics(), renderMerchantDashboard(), renderMerchantOrders(), saveOrderOperations()

## Knowledge Gaps
- **13 isolated node(s):** `RegionConfigs`, `ZanjiState`, `StorefrontLocales`, `PaymentDetailsMap`, `ChatLocales` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `appendWaMessage()` connect `Community 1` to `Community 0`, `Community 4`, `Community 6`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `initStorefront()` connect `Community 0` to `Community 5`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `initMerchant()` connect `Community 4` to `Community 0`, `Community 3`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Zanji Merchant Portal & Storefront` (e.g. with `Application Logic` and `Merchant Portal Logic`) actually correct?**
  _`Zanji Merchant Portal & Storefront` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `initMerchant()` (e.g. with `changeGlobalRegion()` and `switchView()`) actually correct?**
  _`initMerchant()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `initStorefront()` (e.g. with `changeGlobalRegion()` and `switchView()`) actually correct?**
  _`initStorefront()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `appendWaMessage()` (e.g. with `handleNewProductSubmit()` and `sendInboxMerchantReply()`) actually correct?**
  _`appendWaMessage()` has 3 INFERRED edges - model-reasoned connections that need verification._