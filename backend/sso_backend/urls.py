from django.contrib import admin
from django.urls import path, include, re_path
from core.views import CatchAllAssetProxy

urlpatterns = [
    path('admin/', admin.site.urls),
    path('sso-system/', include('core.urls')),
    re_path(r'^(?P<path>.*)$', CatchAllAssetProxy),
]
