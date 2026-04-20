from django.contrib import admin
from .models import Microservice, UserServiceAccount

# Register your models here.

admin.site.register(Microservice)
admin.site.register(UserServiceAccount)
