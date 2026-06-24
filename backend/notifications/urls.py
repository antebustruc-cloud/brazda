from django.urls import path
from .views import SendNotificationView, NearbyNotificationsView, MarkNotificationReadView

urlpatterns = [
    path('send/', SendNotificationView.as_view(), name='send-notification'),
    path('nearby/', NearbyNotificationsView.as_view(), name='nearby-notifications'),
    path('<int:pk>/read/', MarkNotificationReadView.as_view(), name='mark-notification-read'),
]
