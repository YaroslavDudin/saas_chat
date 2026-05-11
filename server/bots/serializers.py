from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions
from .models import Bot, ScenarioNode

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {
            'username': {
                'error_messages': {
                    'unique': 'Пользователь с таким именем уже существует.',
                }
            },
            'email': {
                'error_messages': {
                    'unique': 'Пользователь с такой почтой уже существует.',
                }
            }
        }

    def validate_password(self, value):
        try:
            validate_password(value)
        except exceptions.ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Это имя пользователя уже занято.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Эта электронная почта уже используется.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            validated_data['username'],
            validated_data['email'],
            validated_data['password']
        )
        return user

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
