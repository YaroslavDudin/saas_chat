from rest_framework import serializers
from .models import Bot, ScenarioNode

class ScenarioNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioNode
        fields = ['id', 'step_type', 'content', 'settings']

class BotDashboardSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    nodes = ScenarioNodeSerializer(many=True, read_only=True)
    leads_count = serializers.IntegerField(source='leads.count', read_only=True)

    class Meta:
        model = Bot
        fields = ['id', 'widget_id', 'name', 'theme_color', 'is_active', 'owner', 'nodes', 'leads_count', 'created_at', 'updated_at']
        read_only_fields = ['widget_id', 'created_at', 'updated_at']
