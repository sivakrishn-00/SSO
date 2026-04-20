from django.db import models
from django.contrib.auth.models import User

class State(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Microservice(models.Model):
    name = models.CharField(max_length=100)
    url = models.URLField(max_length=255)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True, blank=True, related_name='services')
    category = models.CharField(max_length=50, default='Core')
    status = models.CharField(max_length=20, default='online')
    icon = models.CharField(max_length=50, default='Box')
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class UserServiceAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='service_accounts')
    microservice = models.ForeignKey(Microservice, on_delete=models.CASCADE, related_name='user_accounts')
    username = models.CharField(max_length=100, null=True, blank=True)
    password = models.CharField(max_length=100, null=True, blank=True)
    session_cookies = models.TextField(null=True, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'microservice')

    def __str__(self):
        return f"{self.user.username} - {self.microservice.name}"

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=100)
    details = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.created_at}"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    photo = models.BinaryField(null=True, blank=True)
    custom_hue = models.IntegerField(default=335) # Default branding hue
    
    def __str__(self):
        return f"Profile of {self.user.username}"
