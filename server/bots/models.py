import uuid
import secrets
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()

def generate_widget_id():
    """Генерирует короткий URL-safe ID для виджета."""
    return secrets.token_urlsafe(8)

class UserProfile(models.Model):
    TIER_CHOICES = [
        ('free', 'Free'),
        ('premium', 'Premium'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name="Пользователь")
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='free', verbose_name="Тариф")
    messages_limit = models.IntegerField(default=100, verbose_name="Лимит сообщений")
    messages_used = models.IntegerField(default=0, verbose_name="Использовано сообщений")

    def __str__(self):
        return f"Profile for {self.user.username} ({self.tier})"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

class TimeStampedModel(models.Model):
    """
    Абстрактная база для моделей с временными метками.
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        abstract = True

class Bot(TimeStampedModel):
    """
    Сущность чат-бота, привязанного к владельцу (пользователю).
    """
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='bots',
        verbose_name="Владелец"
    )
    widget_id = models.CharField(
        max_length=20,
        default=generate_widget_id,
        unique=True,
        editable=False,
        verbose_name="ID виджета"
    )
    name = models.CharField(max_length=255, verbose_name="Название бота")
    theme_color = models.CharField(
        max_length=7, 
        default='#000000', 
        verbose_name="Цвет темы"
    )
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    allowed_domain = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        help_text='Например: example.com'
    )

    class Meta:
        verbose_name = "Бот"
        verbose_name_plural = "Боты"

    def __str__(self):
        return f"{self.name} (Owner: {self.owner.username})"

class ScenarioNode(TimeStampedModel):
    """
    Узел (шаг) в дереве сценария бота.
    """
    STEP_TYPES = [
        ('message', 'Сообщение'),
        ('question', 'Свободный ввод'),
        ('button_choice', 'Выбор кнопкой'),
        ('form', 'Форма (Email/Phone)'),
    ]

    bot = models.ForeignKey(
        Bot, 
        on_delete=models.CASCADE, 
        related_name='nodes',
        verbose_name="Бот"
    )
    step_type = models.CharField(
        max_length=20, 
        choices=STEP_TYPES, 
        verbose_name="Тип шага"
    )
    content = models.TextField(verbose_name="Контент сообщения")
    settings = models.JSONField(
        default=dict, 
        blank=True, 
        verbose_name="Настройки (кнопки, валидация)"
    )

    class Meta:
        verbose_name = "Узел сценария"
        verbose_name_plural = "Узлы сценария"

    def __str__(self):
        return f"{self.bot.name} - {self.get_step_type_display()}"

class Lead(TimeStampedModel):
    """
    Заявка или лид, полученный от посетителя через чат-бота.
    """
    bot = models.ForeignKey(
        Bot, 
        on_delete=models.CASCADE, 
        related_name='leads',
        verbose_name="Бот"
    )
    visitor_id = models.CharField(
        max_length=255, 
        verbose_name="ID посетителя (сессии)"
    )
    data = models.JSONField(
        default=dict, 
        blank=True, 
        verbose_name="Собранные данные"
    )

    class Meta:
        verbose_name = "Лид"
        verbose_name_plural = "Лиды"

    def __str__(self):
        return f"Lead from {self.visitor_id} (Bot: {self.bot.name})"

class ChatMessage(models.Model):
    """
    История сообщений в рамках лида.
    """
    lead = models.ForeignKey(
        Lead, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    node = models.ForeignKey(
        ScenarioNode, 
        on_delete=models.SET_NULL, 
        null=True
    )
    user_answer = models.TextField(blank=True)
    bot_text = models.TextField(default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Сообщение чата"
        verbose_name_plural = "Сообщения чата"

    def __str__(self):
        return f"Msg for {self.lead.visitor_id} at {self.created_at}"
