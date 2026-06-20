from django.urls import path
from .views import CatalogListView

urlpatterns = [
    path('', CatalogListView.as_view(), name='catalog-list'),
]