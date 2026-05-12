from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import ValidationError
from .models import Bot, ScenarioNode, Lead, ChatMessage
from .serializers import BotDashboardSerializer, ScenarioNodeSerializer, RegisterSerializer, UserSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token.key
        }, status=status.HTTP_201_CREATED)

class BotViewSet(viewsets.ModelViewSet):
    serializer_class = BotDashboardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bot.objects.filter(owner=self.request.user).prefetch_related('nodes')

    def perform_create(self, serializer):
        user = self.request.user
        if user.profile.tier == 'free':
            existing_bots_count = Bot.objects.filter(owner=user, is_active=True).count()
            if existing_bots_count >= 1:
                raise ValidationError({"error": "Достигнут лимит ботов на бесплатном тарифе (макс. 1)."})
        serializer.save(owner=user)

    @action(detail=True, methods=['post'], url_path='save-nodes')
    def save_nodes(self, request, pk=None):
        bot = self.get_object()
        nodes_data = request.data

        if not isinstance(nodes_data, list):
            return Response({"error": "Expected a list of nodes."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            bot.nodes.all().delete()
            new_nodes = [
                ScenarioNode(
                    bot=bot,
                    step_type=node.get('step_type'),
                    content=node.get('content'),
                    settings=node.get('settings', {})
                ) for node in nodes_data
            ]
            ScenarioNode.objects.bulk_create(new_nodes)

        serializer = ScenarioNodeSerializer(bot.nodes.all(), many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class BotResponseAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'bot_api'

    def post(self, request):
        widget_id = request.data.get('widget_id')
        visitor_id = request.data.get('visitor_id')
        current_node_id = request.data.get('current_node_id')
        user_value = request.data.get('value')

        if not widget_id or not visitor_id:
            return Response({"error": "widget_id and visitor_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        bot = get_object_or_404(Bot, widget_id=widget_id, is_active=True)

        # Проверка домена (Origin / Referer)
        if bot.allowed_domain:
            origin = request.META.get('HTTP_ORIGIN') or request.META.get('HTTP_REFERER', '')
            if bot.allowed_domain not in origin:
                return Response({"error": "Access from this domain is forbidden."}, status=status.HTTP_403_FORBIDDEN)

        owner_profile = bot.owner.profile

        if owner_profile.messages_used >= owner_profile.messages_limit:
            return Response(
                {"error": "Лимит сообщений исчерпан. Владельцу необходимо обновить тариф."},
                status=status.HTTP_403_FORBIDDEN
            )

        owner_profile.messages_used += 1
        owner_profile.save()

        lead, _ = Lead.objects.get_or_create(bot=bot, visitor_id=visitor_id)
        next_node = None
        
        if current_node_id:
            current_node = ScenarioNode.objects.filter(bot=bot, id=current_node_id).first()
            if current_node:
                target_frontend_id = None
                if current_node.step_type == 'button_choice':
                    branching = current_node.settings.get('branching', {})
                    target_frontend_id = branching.get(user_value)
                else:
                    target_frontend_id = current_node.settings.get('next_node')

                if user_value:
                    data_key = current_node.settings.get('data_key', f"field_{current_node_id}")
                    if not lead.data: lead.data = {}
                    lead.data[data_key] = user_value
                    lead.save()

                # Сохранение истории сообщений
                ChatMessage.objects.create(
                    lead=lead,
                    node=current_node,
                    user_answer=user_value if user_value else "",
                    bot_text=current_node.content
                )

                if target_frontend_id:
                    next_node = ScenarioNode.objects.filter(bot=bot, settings__frontend_id=target_frontend_id).first()

        if not next_node:
            return Response({"message": "Спасибо! Ваш ответ принят, мы свяжемся с вами в ближайшее время."}, status=status.HTTP_200_OK)

        serializer = ScenarioNodeSerializer(next_node)
        return Response(serializer.data)

class BotInitAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, widget_id):
        bot = get_object_or_404(Bot, widget_id=widget_id, is_active=True)
        
        # Проверка домена (Origin / Referer)
        if bot.allowed_domain:
            origin = request.META.get('HTTP_ORIGIN') or request.META.get('HTTP_REFERER', '')
            if bot.allowed_domain not in origin:
                return Response({"error": "Access from this domain is forbidden."}, status=status.HTTP_403_FORBIDDEN)

        first_node = ScenarioNode.objects.filter(bot=bot, settings__is_first=True).first()
        if not first_node:
            first_node = ScenarioNode.objects.filter(bot=bot).order_by('id').first()
        
        return Response({
            "name": bot.name,
            "theme_color": bot.theme_color,
            "first_node": ScenarioNodeSerializer(first_node).data if first_node else None
        })
