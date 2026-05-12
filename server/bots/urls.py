from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import BotViewSet, BotResponseAPIView, BotInitAPIView, RegisterView, LeadViewSet, UserDetailView

router = DefaultRouter()
router.register(r'manage', BotViewSet, basename='bot-manage')
router.register(r'leads', LeadViewSet, basename='bot-leads')

urlpatterns = [
    # Router для CRUD ботов и кастомных действий (save-nodes)
    path('', include(router.urls)),
    
    # Регистрация и аутентификация
    path('register/', RegisterView.as_view(), name='api-register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='api-me'),
    
    # Эндпоинты для работы самого виджета
    path('init/<str:widget_id>/', BotInitAPIView.as_view(), name='bot-init'),
    path('respond/', BotResponseAPIView.as_view(), name='bot-respond'),
]
