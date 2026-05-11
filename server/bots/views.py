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
        Ожидает список объектов: [{"step_type": "...", "content": "...", "settings": {}}, ...]
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
                    content=node.get('content'),
                    settings=node.get('settings', {})
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
        user_value = request.data.get('value')

        if not widget_id or not visitor_id:
            return Response(
                {"error": "widget_id and visitor_id are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        bot = get_object_or_404(Bot, widget_id=widget_id, is_active=True)
        lead, _ = Lead.objects.get_or_create(bot=bot, visitor_id=visitor_id)

        target_frontend_id = None
        
        # Сохраняем данные если они переданы
        if current_node_id:
            current_node = ScenarioNode.objects.filter(bot=bot, id=current_node_id).first()
            if current_node:
                # Определяем следующий узел на основе логики ветвления
                if current_node.step_type == 'button_choice':
                    branching = current_node.settings.get('branching', {})
                    target_frontend_id = branching.get(user_value)
                else:
                    target_frontend_id = current_node.settings.get('next_node')

                # Сохраняем ответ пользователя
                if user_value:
                    data_key = current_node.settings.get('data_key', f"field_{current_node_id}")
                    if not lead.data: lead.data = {}
                    lead.data[data_key] = user_value
                    
                    # Обновляем историю
                    if not lead.chat_history: lead.chat_history = []
                    lead.chat_history.append({
                        "node_id": current_node_id,
                        "type": current_node.step_type,
                        "question": current_node.content,
                        "answer": user_value
                    })
                    lead.save()

        # Находим следующий узел
        if target_frontend_id:
            next_node = ScenarioNode.objects.filter(bot=bot, settings__frontend_id=target_frontend_id).first()
        else:
            # Fallback для старых (линейных) ботов или если ветвление не задано
            next_node = ScenarioNode.objects.filter(bot=bot, id__gt=current_node_id).order_by('id').first() if current_node_id else None

        if not next_node:
            return Response({"message": "Ваш вопрос получен, с вами свяжется менеджер как только освободится."}, status=status.HTTP_200_OK)

        serializer = ScenarioNodeSerializer(next_node)
        return Response(serializer.data)

class BotInitAPIView(APIView):
    """
    API для инициализации виджета. Возвращает настройки бота и первый узел сценария.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, widget_id):
        bot = get_object_or_404(Bot, widget_id=widget_id, is_active=True)
        
        # Ищем узел, помеченный как первый в настройках
        first_node = ScenarioNode.objects.filter(bot=bot, settings__is_first=True).first()
        
        # Если такого нет, берем самый первый созданный
        if not first_node:
            first_node = ScenarioNode.objects.filter(bot=bot).order_by('id').first()
        
        return Response({
            "name": bot.name,
            "theme_color": bot.theme_color,
            "first_node": ScenarioNodeSerializer(first_node).data if first_node else None
        })
