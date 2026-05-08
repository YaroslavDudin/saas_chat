from django.contrib import admin
from .models import Bot, ScenarioNode, Lead

@admin.register(Bot)
class BotAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'is_active')
    list_filter = ('is_active', 'owner')
    search_fields = ('name',)
    ordering = ('-created_at',)

@admin.register(ScenarioNode)
class ScenarioNodeAdmin(admin.ModelAdmin):
    list_display = ('bot', 'step_type', 'short_content')
    list_filter = ('bot', 'step_type')

    def short_content(self, obj):
        if len(obj.content) > 50:
            return f"{obj.content[:50]}..."
        return obj.content
    short_content.short_description = 'Контент'

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('bot', 'contact_info', 'created_at')
    list_filter = ('bot', 'created_at')
    search_fields = ('contact_info', 'visitor_id')
    readonly_fields = ('created_at', 'updated_at')
