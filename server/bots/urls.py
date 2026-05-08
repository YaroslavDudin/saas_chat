from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BotViewSet, BotResponseAPIView, BotInitAPIView

router = DefaultRouter()
router.register(r'manage', BotViewSet, basename='bot-manage')

urlpatterns = [
    # Router для CRUD ботов и кастомных действий (save-nodes)
    path('', include(router.urls)),
    
    # Эндпоинты для работы самого виджета
    path('init/<uuid:widget_id>/', BotInitAPIView.as_view(), name='bot-init'),
    path('respond/', BotResponseAPIView.as_view(), name='bot-respond'),
]
