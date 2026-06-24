import base64
import secrets

from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from opg.models import OPG
from parcels.models import Parcel
from stands.models import Stand
from delivery.models import DeliveryEvent
from .models import Transaction
from .serializers import TransactionSerializer
from .hub3 import build_hub3_text, render_hub3_barcode_png
from .email import send_receipt_email

CHANNEL_MODELS = {
    'parcel': (Parcel, 'parcel_id'),
    'stand': (Stand, 'stand_id'),
    'delivery_event': (DeliveryEvent, 'delivery_event_id'),
}


class CreateTransactionView(APIView):
    """
    Farmer generates a HUB-3A payment barcode for a buyer standing in front
    of them. Creates a pending Transaction and returns the barcode as a
    base64 PNG, ready to display on screen for the buyer to scan.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            opg = request.user.opg
        except OPG.DoesNotExist:
            return Response(
                {'detail': "You need an OPG to get paid. Did your registration complete as a seller?"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not opg.iban:
            return Response(
                {'detail': "Add your IBAN under My OPG before generating a payment barcode."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = float(request.data.get('amount', 1.00))
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({'detail': 'Amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        channel_type = request.data.get('channel_type')
        channel_id = request.data.get('channel_id')

        txn = Transaction(farmer=request.user, amount=amount)
        buyer_email = (request.data.get('buyer_email') or '').strip()
        if buyer_email:
            txn.buyer_email = buyer_email
        channel_spec = CHANNEL_MODELS.get(channel_type)
        if channel_spec and channel_id:
            model, field_name = channel_spec
            try:
                channel = model.objects.get(pk=channel_id)
            except model.DoesNotExist:
                return Response({'detail': 'Channel not found.'}, status=status.HTTP_404_NOT_FOUND)
            if channel.owner != request.user:
                return Response({'detail': "That's not your field/stand/delivery event."}, status=status.HTTP_403_FORBIDDEN)
            setattr(txn, field_name, channel_id)
        txn.reference = 'UBR' + secrets.token_hex(4).upper()
        txn.save()

        hub3_text = build_hub3_text(
            amount_eur=txn.amount,
            receiver_name=opg.name,
            receiver_iban=opg.iban,
            reference=txn.reference,
        )
        barcode_png = render_hub3_barcode_png(hub3_text)
        barcode_b64 = base64.b64encode(barcode_png).decode('ascii')

        data = TransactionSerializer(txn).data
        data['barcode_image'] = f'data:image/png;base64,{barcode_b64}'
        return Response(data, status=status.HTTP_201_CREATED)


class ConfirmTransactionView(APIView):
    """Farmer marks a transaction as paid - the proof-of-sale, and (later) the ratings trigger."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            txn = Transaction.objects.get(pk=pk, farmer=request.user)
        except Transaction.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        txn.is_confirmed = True
        txn.confirmed_at = timezone.now()
        txn.save()
        send_receipt_email(txn)
        return Response(TransactionSerializer(txn).data)


class MyTransactionsView(generics.ListAPIView):
    """A farmer's own sales history."""
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(farmer=self.request.user).order_by('-created_at')
