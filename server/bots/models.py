import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

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
    widget_id = models.UUIDField(
        default=uuid.uuid4, 
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
    chat_history = models.JSONField(
        default=list, 
        verbose_name="История диалога"
    )

    class Meta:
        verbose_name = "Лид"
        verbose_name_plural = "Лиды"

    def __str__(self):
        return f"Lead from {self.visitor_id} (Bot: {self.bot.name})"
