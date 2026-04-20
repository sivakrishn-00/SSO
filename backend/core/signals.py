from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile
import os

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        Profile.objects.get_or_create(user=instance)

@receiver(post_migrate)
def create_default_admin(sender, **kwargs):
    # Only run for the 'core' app to avoid multiple triggers if not needed
    # though post_migrate is called for each app.
    if sender.name == 'core':
        username = 'admin'
        email = 'admin@gmail.com'
        password = 'admin@x'
        
        if not User.objects.filter(username=username).exists():
            print(f"Creating default admin user: {username}")
            User.objects.create_superuser(username=username, email=email, password=password)
            print("Default admin created successfully.")
        else:
            print(f"Admin user '{username}' already exists.")
