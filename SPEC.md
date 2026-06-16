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
