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
