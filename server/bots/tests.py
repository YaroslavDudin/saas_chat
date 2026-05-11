from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import Bot, ScenarioNode, Lead

class BotFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_superuser(username='testadmin', password='password', email='test@example.com')
        self.client.force_authenticate(user=self.user)
        self.bot = Bot.objects.create(owner=self.user, name="Test Bot")

    def test_create_bot(self):
        url = reverse('bot-manage-list')
        data = {'name': 'New Bot'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Bot.objects.count(), 2)

    def test_delete_bot(self):
        url = reverse('bot-manage-detail', args=[self.bot.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Bot.objects.count(), 0)

    def test_save_branched_nodes(self):
        url = reverse('bot-manage-save-nodes', args=[self.bot.id])
        data = [
            {
                "step_type": "button_choice",
                "content": "Choose branching",
                "settings": {
                    "frontend_id": "start",
                    "is_first": True,
                    "buttons": ["Left", "Right"],
                    "branching": {"Left": "left_node", "Right": "right_node"}
                }
            },
            {
                "step_type": "message",
                "content": "You went left",
                "settings": {"frontend_id": "left_node"}
            },
            {
                "step_type": "message",
                "content": "You went right",
                "settings": {"frontend_id": "right_node"}
            }
        ]
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ScenarioNode.objects.count(), 3)

    def test_chat_branching_logic(self):
        # Setup branched nodes
        self.test_save_branched_nodes()
        
        # 1. Init bot
        init_url = reverse('bot-init', args=[self.bot.widget_id])
        response = self.client.get(init_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_node']['content'], "Choose branching")
        
        start_node_id = response.data['first_node']['id']
        
        # 2. Respond with "Left"
        respond_url = reverse('bot-respond')
        response = self.client.post(respond_url, {
            "widget_id": str(self.bot.widget_id),
            "visitor_id": "test_visitor",
            "current_node_id": start_node_id,
            "value": "Left"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], "You went left")
        
        # 3. Verify lead history
        lead = Lead.objects.get(visitor_id="test_visitor")
        self.assertEqual(len(lead.chat_history), 1)
        self.assertEqual(lead.chat_history[0]['answer'], "Left")

    def test_chat_linear_fallback(self):
        # Setup linear nodes (no branching in settings)
        ScenarioNode.objects.create(bot=self.bot, step_type='message', content="Step 1")
        node2 = ScenarioNode.objects.create(bot=self.bot, step_type='message', content="Step 2")
        
        node1 = ScenarioNode.objects.get(content="Step 1")
        
        respond_url = reverse('bot-respond')
        response = self.client.post(respond_url, {
            "widget_id": str(self.bot.widget_id),
            "visitor_id": "test_visitor",
            "current_node_id": node1.id,
            "value": "Next"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], "Step 2")
