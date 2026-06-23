"""
HUB-3A (HRVHUB30) payment barcode generation.

This builds the exact text payload Croatian banking apps expect when they
scan a 2D payment barcode, then renders it as a PDF417 image. Buildable
entirely in-house - no external API or processor involved.

Field order and lengths follow the official HUB-3 standard published by the
Croatian Banking Association (HUB), the same format used by the
"pdf417-generator" npm package and the hub3.bigfish.software reference
implementation:

  1.  "HRVHUB30"        fixed header
  2.  currency           ISO 4217 code (EUR)
  3.  amount              15 digits, zero-padded, amount in cents (no separators)
  4.  sender.name         payer name/company, max 30 chars
  5.  sender.street       payer address, max 27 chars
  6.  sender.place        payer postcode + city, max 27 chars
  7.  receiver.name       payee name/company, max 25 chars
  8.  receiver.street     payee address, max 25 chars
  9.  receiver.place      payee postcode + city, max 27 chars
  10. receiver.iban       max 21 chars, starts with HR
  11. receiver.model      4 chars, e.g. "HR00" (no specific reference model)
  12. receiver.reference  max 22 chars
  13. purpose             4-letter ISO 20022 purpose code
  14. description         max 35 chars

We deliberately leave sender fields blank: the buyer pays from their own
banking app using their own account, so we don't need (or have) their name
and address - this is normal practice for ad-hoc/QR-generated payment slips.
"""
import re
from io import BytesIO

from pdf417gen import encode, render_image

IBAN_HR_RE = re.compile(r'^HR\d{19}$')


def validate_hr_iban(value):
    """Raises ValueError if value isn't a syntactically valid Croatian IBAN."""
    cleaned = (value or '').replace(' ', '').upper()
    if not IBAN_HR_RE.match(cleaned):
        raise ValueError('Not a valid Croatian IBAN (expected HR followed by 19 digits, 21 characters total)')
    return cleaned


def _field(value, max_len):
    return (value or '')[:max_len]


def build_hub3_text(
    *,
    amount_eur,
    receiver_name,
    receiver_iban,
    receiver_street='',
    receiver_place='',
    reference='',
    model='HR00',
    purpose='GDDS',
    description='Ubrano payment',
    sender_name='',
    sender_street='',
    sender_place='',
):
    amount_cents = int(round(float(amount_eur) * 100))
    lines = [
        'HRVHUB30',
        'EUR',
        f'{amount_cents:015d}',
        _field(sender_name, 30),
        _field(sender_street, 27),
        _field(sender_place, 27),
        _field(receiver_name, 25),
        _field(receiver_street, 25),
        _field(receiver_place, 27),
        _field(receiver_iban, 21),
        _field(model, 4),
        _field(reference, 22),
        _field(purpose, 4),
        _field(description, 35),
    ]
    return '\n'.join(lines)


def render_hub3_barcode_png(hub3_text):
    """Renders the HUB-3A text payload as a PDF417 barcode, returns PNG bytes."""
    codes = encode(hub3_text)
    image = render_image(codes)
    buf = BytesIO()
    image.save(buf, format='PNG')
    return buf.getvalue()
