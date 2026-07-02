from datetime import timedelta

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import DeliveryInterest
from users.permissions import IsSeller
from .models import FieldInterest, OPGRating, ProductRating, BuyerRating
from .serializers import (
    OPGRatingSerializer, ProductRatingSerializer,
    BuyerRatingSerializer, PendingSurveySerializer, PendingBuyerRatingSerializer,
)

SURVEY_DELAY_HOURS = 48


# ─── Field Interest ("I'm interested" for parcels/fields) ────────────────────

class FieldInterestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, parcel_id):
        from parcels.models import Parcel
        try:
            parcel = Parcel.objects.get(pk=parcel_id)
        except Parcel.DoesNotExist:
            return Response({'detail': 'Field not found.'}, status=status.HTTP_404_NOT_FOUND)
        interest, created = FieldInterest.objects.get_or_create(
            buyer=request.user, parcel=parcel
        )
        return Response({'id': interest.id, 'created': created}, status=status.HTTP_201_CREATED)


# ─── Pending surveys (lazy 48h check) ────────────────────────────────────────

class PendingSurveysView(APIView):
    """
    Called on app open / dashboard load.
    Returns pending surveys for interests older than 48h that haven't been
    dismissed yet. Each survey carries the OPG's full product list so the
    frontend can render the "what did you pick?" step without another call.
    Returns at most 1 at a time - don't spam the buyer with multiple prompts.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cutoff = timezone.now() - timedelta(hours=SURVEY_DELAY_HOURS)
        surveys = []

        # Field interests
        field_interests = FieldInterest.objects.filter(
            buyer=request.user,
            created_at__lte=cutoff,
            surveyed_at__isnull=True,
        ).select_related('parcel__owner__opg').order_by('created_at')

        for fi in field_interests:
            try:
                opg = fi.parcel.owner.opg
            except Exception:
                continue
            products = _opg_products(opg)
            surveys.append({
                'type': 'field',
                'interest_id': fi.id,
                'opg_id': opg.id,
                'opg_name': opg.name,
                'channel_name': fi.parcel.name,
                'products': products,
            })
            break  # one at a time

        # Delivery interests (if no field survey pending)
        if not surveys:
            delivery_interests = DeliveryInterest.objects.filter(
                buyer=request.user,
                created_at__lte=cutoff,
                surveyed_at__isnull=True,
            ).select_related('delivery_event__owner__opg').order_by('created_at')

            for di in delivery_interests:
                try:
                    opg = di.delivery_event.owner.opg
                except Exception:
                    continue
                products = _opg_products(opg)
                surveys.append({
                    'type': 'delivery',
                    'interest_id': di.id,
                    'opg_id': opg.id,
                    'opg_name': opg.name,
                    'channel_name': di.delivery_event.name,
                    'products': products,
                })
                break

        # Stand interests - products route to SUPPLYING OPG, not the stand owner
        if not surveys:
            from stands.models import StandInterest, StandSupplierRequest
            stand_interests = StandInterest.objects.filter(
                buyer=request.user,
                created_at__lte=cutoff,
                surveyed_at__isnull=True,
            ).select_related('stand__owner__opg').order_by('created_at')

            for si in stand_interests:
                # Build per-product supplier OPG mapping
                approved = StandSupplierRequest.objects.filter(
                    stand=si.stand,
                    status='accepted',
                ).select_related('farmer__opg', 'catalog_item')

                # Group products by supplier OPG
                opg_products = {}
                for req in approved:
                    try:
                        opg = req.farmer.opg
                    except Exception:
                        continue
                    if opg.id not in opg_products:
                        opg_products[opg.id] = {'opg_id': opg.id, 'opg_name': opg.name, 'products': []}
                    opg_products[opg.id]['products'].append({
                        'id': req.catalog_item.id,
                        'name': req.catalog_item.name,
                        'category': req.catalog_item.category,
                    })

                if opg_products:
                    # Show the first supplier group; re-open if multiple (handled by dismissing one at a time)
                    first = list(opg_products.values())[0]
                    surveys.append({
                        'type': 'stand',
                        'interest_id': si.id,
                        'opg_id': first['opg_id'],
                        'opg_name': first['opg_name'],
                        'channel_name': si.stand.name,
                        'products': first['products'],
                        'has_more_suppliers': len(opg_products) > 1,
                    })
                else:
                    # Stand has no approved suppliers, just rate the stand owner's OPG
                    try:
                        opg = si.stand.owner.opg
                        surveys.append({
                            'type': 'stand',
                            'interest_id': si.id,
                            'opg_id': opg.id,
                            'opg_name': opg.name,
                            'channel_name': si.stand.name,
                            'products': _opg_products(opg),
                            'has_more_suppliers': False,
                        })
                    except Exception:
                        pass
                break

        return Response(surveys)


def _opg_products(opg):
    """All catalog items ever listed by this OPG across all channels."""
    from products.models import Product
    from catalog.models import ProductCatalog
    item_ids = Product.objects.filter(
        seller=opg.owner,
        catalog_item__isnull=False,
    ).values_list('catalog_item_id', flat=True).distinct()
    items = ProductCatalog.objects.filter(pk__in=item_ids)
    return [{'id': item.id, 'name': item.name, 'category': item.category} for item in items]


# ─── Dismiss survey (mark as shown regardless of answer) ──────────────────────

class DismissSurveyView(APIView):
    """
    Frontend calls this after the buyer completes or skips the survey.
    Sets surveyed_at so the same interest never triggers again.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        interest_type = request.data.get('type')
        interest_id = request.data.get('interest_id')
        now = timezone.now()

        if interest_type == 'field':
            FieldInterest.objects.filter(pk=interest_id, buyer=request.user).update(surveyed_at=now)
        elif interest_type == 'delivery':
            DeliveryInterest.objects.filter(pk=interest_id, buyer=request.user).update(surveyed_at=now)
        elif interest_type == 'stand':
            from stands.models import StandInterest
            StandInterest.objects.filter(pk=interest_id, buyer=request.user).update(surveyed_at=now)
        else:
            return Response({'detail': 'type must be field, delivery or stand.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': 'ok'})


# ─── OPG rating (buyer rates OPG) ────────────────────────────────────────────

class OPGRatingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        opg_id = request.data.get('opg')
        score = request.data.get('score')
        comment = (request.data.get('comment') or '').strip()
        if not opg_id or not score:
            return Response({'detail': 'opg and score are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            score = int(score)
            assert 1 <= score <= 5
        except (ValueError, AssertionError):
            return Response({'detail': 'score must be 1–5.'}, status=status.HTTP_400_BAD_REQUEST)

        from opg.models import OPG
        try:
            opg = OPG.objects.get(pk=opg_id)
        except OPG.DoesNotExist:
            return Response({'detail': 'OPG not found.'}, status=status.HTTP_404_NOT_FOUND)

        rating, _ = OPGRating.objects.update_or_create(
            buyer=request.user,
            opg=opg,
            defaults={'score': score, 'comment': comment},
        )
        return Response(OPGRatingSerializer(rating).data, status=status.HTTP_200_OK)

    def get(self, request):
        """Returns this buyer's own OPG ratings."""
        ratings = OPGRating.objects.filter(buyer=request.user).select_related('opg')
        return Response(OPGRatingSerializer(ratings, many=True).data)


# ─── Product rating ───────────────────────────────────────────────────────────

class ProductRatingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        opg_id = request.data.get('opg')
        catalog_item_id = request.data.get('catalog_item')
        score = request.data.get('score')
        if not opg_id or not catalog_item_id or not score:
            return Response({'detail': 'opg, catalog_item and score are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            score = int(score)
            assert 1 <= score <= 5
        except (ValueError, AssertionError):
            return Response({'detail': 'score must be 1–5.'}, status=status.HTTP_400_BAD_REQUEST)

        rating, _ = ProductRating.objects.update_or_create(
            buyer=request.user,
            opg_id=opg_id,
            catalog_item_id=catalog_item_id,
            defaults={'score': score},
        )
        return Response(ProductRatingSerializer(rating).data, status=status.HTTP_200_OK)


# ─── Buyer rating (farmer rates buyer) ───────────────────────────────────────

class BuyerRatingView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get(self, request):
        """Farmer's pending-to-rate buyers queue."""
        cutoff = timezone.now() - timedelta(hours=SURVEY_DELAY_HOURS)
        pending = []

        # Field interests that are old enough and not yet rated by this farmer
        already_rated_ids = set(
            BuyerRating.objects.filter(farmer=request.user).values_list('buyer_id', flat=True)
        )

        for fi in FieldInterest.objects.filter(
            parcel__owner=request.user,
            created_at__lte=cutoff,
        ).select_related('buyer', 'parcel').order_by('-created_at'):
            if fi.buyer_id not in already_rated_ids:
                pending.append({
                    'interest_type': 'field',
                    'interest_id': fi.id,
                    'buyer_id': fi.buyer_id,
                    'buyer_name': fi.buyer.get_full_name() or fi.buyer.email,
                    'buyer_email': fi.buyer.email,
                    'buyer_phone': fi.buyer.phone or '',
                    'channel_name': fi.parcel.name,
                    'interested_at': fi.created_at,
                })

        for di in DeliveryInterest.objects.filter(
            delivery_event__owner=request.user,
            created_at__lte=cutoff,
        ).select_related('buyer', 'delivery_event').order_by('-created_at'):
            if di.buyer_id not in already_rated_ids:
                pending.append({
                    'interest_type': 'delivery',
                    'interest_id': di.id,
                    'buyer_id': di.buyer_id,
                    'buyer_name': di.buyer.get_full_name() or di.buyer.email,
                    'buyer_email': di.buyer.email,
                    'buyer_phone': di.buyer.phone or '',
                    'channel_name': di.delivery_event.name,
                    'interested_at': di.created_at,
                })

        from stands.models import StandInterest
        for si in StandInterest.objects.filter(
            stand__owner=request.user,
            created_at__lte=cutoff,
        ).select_related('buyer', 'stand').order_by('-created_at'):
            if si.buyer_id not in already_rated_ids:
                pending.append({
                    'interest_type': 'stand',
                    'interest_id': si.id,
                    'buyer_id': si.buyer_id,
                    'buyer_name': si.buyer.get_full_name() or si.buyer.email,
                    'buyer_email': si.buyer.email,
                    'buyer_phone': si.buyer.phone or '',
                    'channel_name': si.stand.name,
                    'interested_at': si.created_at,
                })

        return Response(pending)

    def post(self, request):
        buyer_id = request.data.get('buyer')
        score = request.data.get('score')
        comment = (request.data.get('comment') or '').strip()
        if not buyer_id or not score:
            return Response({'detail': 'buyer and score are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            score = int(score)
            assert 1 <= score <= 5
        except (ValueError, AssertionError):
            return Response({'detail': 'score must be 1–5.'}, status=status.HTTP_400_BAD_REQUEST)

        from users.models import User
        try:
            buyer = User.objects.get(pk=buyer_id)
        except User.DoesNotExist:
            return Response({'detail': 'Buyer not found.'}, status=status.HTTP_404_NOT_FOUND)

        rating, _ = BuyerRating.objects.update_or_create(
            farmer=request.user,
            buyer=buyer,
            defaults={'score': score, 'comment': comment},
        )
        return Response(BuyerRatingSerializer(rating).data, status=status.HTTP_200_OK)


# ─── Public OPG rating summary (for listing pages) ───────────────────────────

class OPGRatingSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, opg_id):
        from opg.models import OPG
        try:
            opg = OPG.objects.get(pk=opg_id)
        except OPG.DoesNotExist:
            return Response({'detail': 'OPG not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Buyer's own rating for this OPG (so the UI can show "your rating")
        own_rating = OPGRating.objects.filter(buyer=request.user, opg=opg).first()
        own_product_ratings = ProductRating.objects.filter(
            buyer=request.user, opg=opg
        ).values('catalog_item_id', 'score')

        return Response({
            'opg_id': opg.id,
            'opg_name': opg.name,
            'rating': opg.rating,
            'rating_count': opg.rating_count,
            'your_rating': own_rating.score if own_rating else None,
            'your_product_ratings': {r['catalog_item_id']: r['score'] for r in own_product_ratings},
        })
