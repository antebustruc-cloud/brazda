# Ubrano — MVP Specification

## Identity
- Farmer registers → mandatory OPG pin (private, never shown to buyers)
- OPG = identity + rating + origin pin (marketing data + Phase 2 route corridor)
- No products on OPG

## Three Channels (products live here, not on OPG)
- **Field** — public pin, products, PickYourOwn (buyer comes & picks)
- **Stand** — public pin, products, "I'm here now" (buyer just goes, no request)
- **Delivery Event** — destination pin + radius + date/time window, products (OPG hidden)

## Products
- Belong to a channel (field/stand/event), not OPG
- One channel → many products
- Active/Deactivate toggle (daily driver)

## Buyer
- Choose mode on entry: PickYourOwn / Stands / Delivery
- See active products + price + distance inline while scrolling
- Filters v1: distance, price, product type; farmer + product rating ONLY for PickYourOwn
- Stands & Delivery: no rating filter in v1
- PickYourOwn & Delivery: "Send Request" (product + approx kg + date + approx time) → farmer approves
- Stands: no request, just go

## Ratings v1
- Farmer + product, PickYourOwn only
- Anonymous option, one-per-buyer updatable, "didn't show / didn't go"
- Stand & delivery ratings = Phase 2

## Phase 2
- Delivery route corridor (towns on the way)
- Push notifications, stand-owner payments
- Multi-stand rating, i18n (HR/EN), Google login
- No-show dispute flow, OPG product auto-suggest

## Phase 3
- Work-for-goods barter (buyer offers labor for produce; farmer offers work for goods/money)

## Build Order
1. OPG model + mandatory pin at registration
2. Product links to channel
3. Stands (full loop)
4. Fields / PickYourOwn (full loop + request + ratings)
5. Delivery events (full loop + request)
6. Tailwind polish


## Controlled Product Catalog (admin-managed)
- Admin maintains master product list in Django admin
- ProductCatalog: unique ID, name (e.g. "Apple"), category, image
- Variety (optional sub-product): "Apple > Pink Lady, Idared" — info only, not mandatory
- Farmers PICK from catalog when listing — no free-text (prevents apple/appl/jabuka fragmentation, makes search reliable)

## Product structure (refactored)
- ProductCatalog (admin controls): name, category, image, varieties
- ProductListing (farmer creates): references a catalog item + a channel (stand/field/event) + price + active toggle + optional variety

## Per-channel product management
- Open a specific stand/field/event → manage ITS products there
- Same reusable view for all three channels
- Farmer picks product from catalog, sets price, toggles active

## Build order (updated)
1. ✅ OPG model + registration
2. ✅ Stand model + creation
3. ProductCatalog model + admin (with images) + varieties
4. Refit ProductListing to reference catalog
5. Per-channel "manage products" view (stand/field/event)
6. Buyer search: stands near me, fields near me, delivery
7. Ratings (PickYourOwn)
8. Tailwind polish

## Updated Architecture (Catalog + Channels + Ratings)

### Master Catalog (admin-only)
- Admin maintains master product list (Apple Idared, Pear...) + varieties + images
- Farmers can ONLY list products that exist in master catalog
- Phase 2: farmers can request "please add X" if missing

### No standalone Products page
- Farmers add products directly ON each channel (field/stand/delivery event)
- Pick from master catalog → set price → active toggle
- Same product can be listed on multiple channels
- Farmer portfolio/history = DERIVED from listings, queried for analytics

### Per-channel product management (identical UX across all three)
- Click a field/stand/event → expand inline → manage its products
- Pick from catalog, set price, toggle active, remove

### Delivery events (when built)
- Create event: date + approx time + destination pin + radius
- Buyer "delivery near me": date OPTIONAL (blank = all active) + filters

### Ratings — MODEL + DISPLAY in MVP, trigger in Phase 2
- Channel-agnostic by design (one reputation follows farmer everywhere)
- FarmerRating: (rater, farmer) → overall, lives on OPG
- ProductRating: (rater, farmer, catalog_item) → ONE reputation across ALL his channels
- Unified rating closes fraud loophole (can't hide bad stand behind good field)
- MVP: store + average + display in search; seed via admin
- Phase 2: order-triggered "rate after visit" flow, no-show/dispute lifecycle
- Filters: min farmer rating + min product rating


## PHASE: Transactions + Ratings (the pillar — post-MVP, defining phase)

### Why these are one phase
- Ratings have NO honest trigger without proof of transaction
- Trust-based = gameable (rejected). Two-sided confirmation = farmer who sold bad goods just denies buyer ever came (rejected, asymmetric incentive)
- The ONLY real proof a deal happened = the financial transaction
- So: payments unlock trustworthy ratings. Same phase.

### Ratings rules (locked)
- Rating = once per (buyer + product + farmer), NOT per purchase (buy 10x = 1 rating)
- Ratings are updatable/removable
- Every user gets a "My Ratings" page to edit/remove their ratings
- Channel-agnostic: one reputation per (farmer + product) across all channels
- Rating creation GATED by a real transaction (financial proof)
- Ratings are a core pillar — the whole value prop is trustworthy reputation that can't be bought. Not pay-to-win. Quality/reputation = the moat (like SEO > PPC)

### Payments — honest technical reality
- NFC phone-to-phone tap-to-pay: NOT buildable (Apple locks NFC chip to Apple Pay; Android heavily restricted). Do not design around it.
- REAL options:
  1. Marketplace card processor (Stripe Connect-style): buyer pays in-app, money routes to farmer's connected account/IBAN, platform takes cut. Standard marketplace path. Gives transaction proof.
  2. QR / IBAN bank payment (HUB-3): farmer's app shows payment QR, buyer scans with own bank app, pays to IBAN. Croatia-friendly, low/no card fees, fits local banking habits. Most pragmatic.
  3. Instant SEPA / pay-by-bank APIs: account-to-account, direct to IBAN. More complex.
- Investigate: KEKS Pay (Croatian mobile payment app) as a local rail.

### Outcome of this phase
- Turns Ubrano from "find farmer + call" into "buy + build real reputation"
- Transaction = rating trigger, naturally


## Payment research findings (for Transactions phase)

### Candidates
- KEKS Pay (Erste Bank): QR/deep-link merchant payments, bank-agnostic, funds next day, small % fee, no Erste account needed. Contact: kekspaysupport@erstebank.hr
- Aircash: CNB-licensed EMI, top-rated in Croatia, EU-valid. Has documented MARKETPLACE flow (user picks merchant in-app, merchant approves/declines) — closest fit to Ubrano's many-farmers model. NOTE: detailed API appears to route via Nuvei (orchestrator) — ask about direct vs middleman, and cost.
- Stripe Connect: gold-standard marketplace plumbing (platform + many sellers + auto split), card-based, EU-ready. Fallback if local rails don't offer marketplace API. More fees, less "local" feel.
- Card gateways (Monri/WSPay, Nexi): card-only, not the cheap local rail we want.

### HUB-3A 2D barcode (buildable now, cheap)
- Croatian standard payment barcode (PDF417) — encodes payee IBAN, amount, reference, description
- Flow: store farmer OPG IBAN → farmer enters weight → app computes total → generates HUB-3A barcode on screen → buyer scans with their OWN m-banking app → pays
- PRO: no processor, no fees, every Croatian bank app reads it, very local
- CON: NOT auto-confirmed back to Ubrano (bank-to-bank). So alone it can't verify payment for the ratings trigger. Needs API (KEKS/Aircash) or bank feed for verification.
- Likely end state: barcode for easy UX + provider API for verified confirmation (ratings trigger)

### Reality check
- NFC phone-to-phone tap-to-pay: still NOT buildable (confirmed)
- Ratings trigger needs VERIFIED payment = provider API, not bare barcode

## Payment + Ratings ROADMAP (phased, pulled by users/volume not time)

### MVP
- Directory + 3 channels + contact (phone/Call). No payments, no ratings.
- Audience: friends + friends-of-friends.

### Phase 2 — Barcode payments + first ratings
- HUB-3A PDF417 barcode: farmer enters weight → app computes total (price × kg) → generates barcode on screen (farmer's OPG IBAN + amount) → buyer scans with own m-banking app → pays
- Farmer presses "Payment confirmed" button → this is the proof-of-sale
- Confirmation is asymmetric in the RIGHT direction: farmer confirms his own incoming money (wants to), which unlocks the BUYER's rating. Farmer has no incentive to fake-confirm a non-sale.
- This unlocks the first honest ratings (the pillar) with zero processor/fees/approvals
- Buildable entirely in-house

### Phase 3 — KEKS Pay / Aircash
- Move when there's traction (= leverage + they become free marketing; with 0 users we're invisible to them)
- Marketplace routing (pay each farmer's account) + payment-confirmation webhook = verified ratings trigger, automated
- Single-merchant KEKS is available even to small merchants (cafes/stalls); marketplace version likely needs proof we're real

### Phase 4 (maybe earlier) — Stripe for tourists
- Foreign cards / Apple-Google Pay, no local account needed
- Coastal summer tourist demand: "don't bring your own tomato — pick a fresh one here"
- Could be pulled forward if tourist revenue spikes near the coast

### Rule: phase transitions triggered by USERS + VOLUME, not calendar time

## Frontend modernization (deliberate task, before more frontend / React Native)
- Current: create-react-app (CRA) — deprecated, slow, fights Tailwind. Styling is inline.
- DECISION: migrate CRA → Vite, then add Tailwind. Vite+Tailwind is the modern, supported, scalable combo; skills carry into React Native.
- Do NOT waste effort on Tailwind-on-CRA (throwaway).
- MVP ships plain (inline styles). "Judge the idea and functionality, not the looks."
- Bootstrap = optional quick coat if ever needed, but Vite+Tailwind is the real answer.
