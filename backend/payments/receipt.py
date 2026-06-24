"""
Generates a simple payment-confirmation PDF - NOT a legally fiscalized
receipt. Croatian B2C fiscalization (since 1 Jan 2026) now covers
transactional-account payments too, with no size-based exemption. Whether
that applies to a given OPG depends on their own tax/VAT status - that's
between them and their accountant, not something this app determines.
This PDF exists purely as a clear, useful record for both sides of the sale.
"""
from io import BytesIO
from pathlib import Path
from fpdf import FPDF

FONT_DIR = Path(__file__).resolve().parent / 'fonts'

BRAND_GREEN = (45, 106, 79)  # #2d6a4f
GREY = (120, 120, 120)

DISCLAIMER = (
    "Ovo je informativna potvrda o plaćanju, a NE fiskalizirani račun. Prodavac (OPG) "
    "ostaje sam odgovoran za svoje porezne i fiskalizacijske obveze.\n\n"
    "This is an informational payment confirmation, NOT a legally fiscalized receipt. "
    "The seller (OPG) remains solely responsible for their own tax and fiscalization "
    "obligations."
)


def build_receipt_pdf(transaction):
    farmer = transaction.farmer
    opg = getattr(farmer, 'opg', None)
    farmer_name = opg.name if opg else (farmer.get_full_name() or farmer.email)

    pdf = FPDF()
    pdf.add_page()
    pdf.add_font('DejaVu', '', str(FONT_DIR / 'DejaVuSans.ttf'))
    pdf.add_font('DejaVu', 'B', str(FONT_DIR / 'DejaVuSans-Bold.ttf'))

    pdf.set_font('DejaVu', 'B', 20)
    pdf.set_text_color(*BRAND_GREEN)
    pdf.cell(0, 14, 'Ubrano', new_x='LMARGIN', new_y='NEXT')

    pdf.set_font('DejaVu', 'B', 13)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, 'Potvrda o plaćanju / Payment confirmation', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(4)

    when = transaction.confirmed_at.strftime('%d.%m.%Y. %H:%M') if transaction.confirmed_at else ''
    rows = [
        ('Datum / Date', when),
        ('Referenca / Reference', transaction.reference),
        ('OPG', farmer_name),
        ('Iznos / Amount', f'{transaction.amount} EUR'),
    ]
    pdf.set_font('DejaVu', '', 11)
    for label, value in rows:
        pdf.set_font('DejaVu', 'B', 11)
        pdf.cell(55, 8, label)
        pdf.set_font('DejaVu', '', 11)
        pdf.cell(0, 8, str(value), new_x='LMARGIN', new_y='NEXT')

    pdf.ln(8)
    pdf.set_font('DejaVu', '', 9)
    pdf.set_text_color(*GREY)
    pdf.multi_cell(0, 5, DISCLAIMER)

    buf = BytesIO()
    pdf.output(buf)
    return buf.getvalue()
