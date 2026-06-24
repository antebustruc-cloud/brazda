from django.core.mail import EmailMessage
from django.conf import settings
from .receipt import build_receipt_pdf


def send_receipt_email(transaction):
    """Best-effort - a failed email should never block a confirmed payment."""
    if not transaction.buyer_email:
        return
    try:
        pdf_bytes = build_receipt_pdf(transaction)
        msg = EmailMessage(
            subject=f'Ubrano - potvrda o plaćanju {transaction.reference}',
            body=(
                "U privitku je potvrda o plaćanju.\n\n"
                "Napomena: ovo NIJE fiskalizirani račun - prodavac je sam odgovoran "
                "za svoje porezne obveze.\n\n"
                "---\n\n"
                "Attached is your payment confirmation.\n"
                "Note: this is NOT a legally fiscalized receipt - the seller remains "
                "responsible for their own tax obligations."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[transaction.buyer_email],
        )
        msg.attach(f'ubrano-receipt-{transaction.reference}.pdf', pdf_bytes, 'application/pdf')
        msg.send(fail_silently=True)
    except Exception:
        pass
