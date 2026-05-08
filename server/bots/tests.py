import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Bot, ScenarioNode, Lead

User = get_user_model()

class BotAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password')
        self.client.force_authenticate(user=self.user)
        
        # Создаем бота
        self.bot = Bot.objects.create(
            name="Test Bot",
            owner=self.user,
            theme_color="#FF5733"
        )
        
        # Создаем узлы сценария
        self.node1 = ScenarioNode.objects.create(
            bot=self.bot,
            step_type='message',
            content="Hello!"
        )
        self.node2 = ScenarioNode.objects.create(
            bot=self.bot,
            step_type='phone_collection',
            content="What is your phone?"
        )

    def test_bot_initialization_api(self):
        """Проверка API инициализации виджета"""
        url = reverse('bot-init', kwargs={'widget_id': self.bot.widget_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Test Bot")
        self.assertEqual(response.data['theme_color'], "#FF5733")
        self.assertEqual(response.data['first_node']['id'], self.node1.id)

    def test_bot_respond_api_progression(self):
        """Проверка продвижения по сценарию и создания лида"""
        url = reverse('bot-respond')
        data = {
            "widget_id": str(self.bot.widget_id),
            "visitor_id": "visitor_123",
            "current_node_id": self.node1.id
        }
        
        # Первый ответ
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.node2.id)
        
        # Проверяем, что лид создался
        lead = Lead.objects.get(bot=self.bot, visitor_id="visitor_123")
        self.assertEqual(len(lead.chat_history), 1)
        self.assertEqual(lead.chat_history[0]['node_id'], self.node1.id)

    def test_bot_dashboard_access(self):
        """Проверка, что пользователь видит только своих ботов"""
        # Создаем другого пользователя и его бота
        other_user = User.objects.create_user(username='other', password='password')
        Bot.objects.create(name="Other Bot", owner=other_user)
        
        url = reverse('bot-manage-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Test Bot")

    def test_save_nodes_action(self):
        """Проверка массового обновления сценария"""
        url = reverse('bot-manage-save-nodes', kwargs={'pk': self.bot.id})
        new_nodes_data = [
            {"step_type": "message", "content": "New 1"},
            {"step_type": "message", "content": "New 2"}
        ]
        
        response = self.client.post(url, new_nodes_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ScenarioNode.objects.filter(bot=self.bot).count(), 2)
        self.assertEqual(ScenarioNode.objects.filter(bot=self.bot).first().content, "New 1")
