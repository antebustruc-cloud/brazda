from django.urls import path
from .views import MyOPGView

urlpatterns = [
    path('', MyOPGView.as_view(), name='my-opg'),
]
