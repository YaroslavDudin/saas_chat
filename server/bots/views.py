from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Bot, ScenarioNode, Lead
from .serializers import BotDashboardSerializer, ScenarioNodeSerializer

class BotViewSet(viewsets.ModelViewSet):
    serializer_class = BotDashboardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Пользователь видит только своих ботов
        return Bot.objects.filter(owner=self.request.user).prefetch_related('nodes')

    def perform_create(self, serializer):
        # Автоматическое назначение владельца
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'], url_path='save-nodes')
    def save_nodes(self, request, pk=None):
        """
        Удаляет старые узлы и массово создает новые для конкретного бота.
        Ожидает список объектов: [{"step_type": "...", "content": "..."}, ...]
        """
        bot = self.get_object()
        nodes_data = request.data

        if not isinstance(nodes_data, list):
            return Response(
                {"error": "Expected a list of nodes."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Удаляем старые сценарии
            bot.nodes.all().delete()
            
            # Массовое создание новых узлов
            new_nodes = [
                ScenarioNode(
                    bot=bot,
                    step_type=node.get('step_type'),
                    content=node.get('content')
                ) for node in nodes_data
            ]
            ScenarioNode.objects.bulk_create(new_nodes)

        # Возвращаем обновленный список узлов
        serializer = ScenarioNodeSerializer(bot.nodes.all(), many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class BotResponseAPIView(APIView):
    """
    API для обработки ответов виджета и продвижения по сценарию.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        widget_id = request.data.get('widget_id')
        visitor_id = request.data.get('visitor_id')
        current_node_id = request.data.get('current_node_id')

        if not widget_id or not visitor_id:
            return Response(
                {"error": "widget_id and visitor_id are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Находим бота
        bot = get_object_or_404(Bot, widget_id=widget_id, is_active=True)

        # 2. Находим или создаем лид
        lead, created = Lead.objects.get_or_create(
            bot=bot,
            visitor_id=visitor_id
        )

        # 3. Находим текущий узел (если передан)
        current_node = None
        if current_node_id:
            current_node = ScenarioNode.objects.filter(bot=bot, id=current_node_id).first()

        # 4. Логика MVP: находим следующий узел (ID > текущего)
        next_node_query = ScenarioNode.objects.filter(bot=bot)
        if current_node_id:
            next_node_query = next_node_query.filter(id__gt=current_node_id)
        
        next_node = next_node_query.order_by('id').first()

        # 5. Обновляем историю чата
        step_entry = {
            "node_id": current_node_id,
            "step_type": current_node.step_type if current_node else "start",
            "content": current_node.content if current_node else "initial_contact",
            "timestamp": str(lead.updated_at)
        }
        
        if not isinstance(lead.chat_history, list):
            lead.chat_history = []
            
        lead.chat_history.append(step_entry)
        lead.save()

        # 6. Возвращаем следующий узел
        if not next_node:
            return Response({"message": "End of scenario"}, status=status.HTTP_200_OK)

        serializer = ScenarioNodeSerializer(next_node)
        return Response(serializer.data)

class BotInitAPIView(APIView):
    """
    API для инициализации виджета. Возвращает настройки бота и первый узел сценария.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, widget_id):
        bot = get_object_or_404(Bot, widget_id=widget_id, is_active=True)
        first_node = ScenarioNode.objects.filter(bot=bot).order_by('id').first()
        
        return Response({
            "name": bot.name,
            "theme_color": bot.theme_color,
            "first_node": ScenarioNodeSerializer(first_node).data if first_node else None
        })
