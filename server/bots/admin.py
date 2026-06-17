from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Bot, ScenarioNode, Lead, UserProfile

# Define an inline admin descriptor for UserProfile model
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Профиль пользователя'

# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = BaseUserAdmin.list_display + ('get_messages_limit', 'get_messages_used')

    def get_messages_limit(self, instance):
        return instance.profile.messages_limit
    get_messages_limit.short_description = 'Лимит сообщений'

    def get_messages_used(self, instance):
        return instance.profile.messages_used
    get_messages_used.short_description = 'Использовано'

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'tier', 'messages_limit', 'messages_used')
    list_filter = ('tier',)
    search_fields = ('user__username', 'user__email')

@admin.register(Bot)
class BotAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'widget_id', 'is_active')
    list_filter = ('is_active', 'owner')
    search_fields = ('name', 'widget_id')
    readonly_fields = ('widget_id', 'created_at', 'updated_at')
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
    list_display = ('bot', 'visitor_id', 'created_at')
    list_filter = ('bot', 'created_at')
    search_fields = ('visitor_id',)
    readonly_fields = ('created_at', 'updated_at')
