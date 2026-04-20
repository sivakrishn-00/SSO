from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Microservice, UserServiceAccount, State, AuditLog

class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ['id', 'name']

class MicroserviceSerializer(serializers.ModelSerializer):
    state_name = serializers.ReadOnlyField(source='state.name')
    
    class Meta:
        model = Microservice
        fields = ['id', 'name', 'url', 'state', 'state_name', 'category', 'status', 'icon', 'description']

class UserServiceAccountSerializer(serializers.ModelSerializer):
    name = serializers.ReadOnlyField(source='microservice.name')
    url = serializers.ReadOnlyField(source='microservice.url')
    state = serializers.ReadOnlyField(source='microservice.state_id')
    state_name = serializers.ReadOnlyField(source='microservice.state.name')
    category = serializers.ReadOnlyField(source='microservice.category')
    status = serializers.ReadOnlyField(source='microservice.status')
    icon = serializers.ReadOnlyField(source='microservice.icon')
    
    class Meta:
        model = UserServiceAccount
        fields = ['id', 'user', 'microservice', 'name', 'url', 'state', 'state_name', 'category', 'status', 'icon', 'username', 'password']

import base64

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    assignments = UserServiceAccountSerializer(source='service_accounts', many=True, read_only=True)
    photo = serializers.SerializerMethodField()
    custom_hue = serializers.IntegerField(source='profile.custom_hue', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'is_staff', 'is_active', 'assignments', 'photo', 'custom_hue']

    def get_photo(self, obj):
        if hasattr(obj, 'profile') and obj.profile.photo:
            return base64.b64encode(obj.profile.photo).decode('utf-8')
        return None

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_name', 'action', 'details', 'ip_address', 'created_at']
