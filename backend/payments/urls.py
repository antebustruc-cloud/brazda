from django.urls import path
from .views import CreateTransactionView, ConfirmTransactionView, MyTransactionsView

urlpatterns = [
    path('', MyTransactionsView.as_view(), name='my-transactions'),
    path('create/', CreateTransactionView.as_view(), name='create-transaction'),
    path('<int:pk>/confirm/', ConfirmTransactionView.as_view(), name='confirm-transaction'),
]
