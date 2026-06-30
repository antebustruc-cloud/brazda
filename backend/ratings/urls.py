from django.urls import path
from .views import (
    FieldInterestView,
    PendingSurveysView, DismissSurveyView,
    OPGRatingView, ProductRatingView,
    BuyerRatingView,
    OPGRatingSummaryView,
)

urlpatterns = [
    # Field interest ("I'm interested" on field listings)
    path('field-interest/<int:parcel_id>/', FieldInterestView.as_view(), name='field-interest'),

    # Lazy 48h survey
    path('pending-surveys/', PendingSurveysView.as_view(), name='pending-surveys'),
    path('dismiss-survey/', DismissSurveyView.as_view(), name='dismiss-survey'),

    # Buyer rates OPG and products
    path('opg/', OPGRatingView.as_view(), name='opg-rating'),
    path('product/', ProductRatingView.as_view(), name='product-rating'),

    # Farmer rates buyer
    path('buyer/', BuyerRatingView.as_view(), name='buyer-rating'),

    # Public summary for listing pages
    path('opg/<int:opg_id>/summary/', OPGRatingSummaryView.as_view(), name='opg-rating-summary'),
]
