from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from .views import (
    MicroserviceViewSet, LoginView, UserViewSet, 
    UserServiceAccountViewSet, UserDashboardView, 
    StateViewSet, LaunchView, ServiceProxyView, CatchAllAssetProxy, ProfileView,
    AuditLogViewSet
)


router = DefaultRouter()
router.register(r'services', MicroserviceViewSet, basename='services')
router.register(r'microservices', MicroserviceViewSet, basename='microservices')
router.register(r'users', UserViewSet, basename='users')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')


router.register(r'user-assignments', UserServiceAccountViewSet, basename='user-assignments')
router.register(r'states', StateViewSet, basename='states')



urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='portal_login_legacy'),
    path('portal-login/', LoginView.as_view(), name='login'),
    path('dashboard/', UserDashboardView.as_view(), name='dashboard'),
    path('profile/', ProfileView.as_view(), name='profile'),


    path('launch/<int:assignment_id>/', LaunchView.as_view(), name='launch'),
    
    # 1. Primary Proxy Entry point
    re_path(r'^proxy/(?P<assignment_id>\d+)/(?P<path>.*)$', ServiceProxyView.as_view(), name='proxy'),
    
    # 2. Universal Asset Relayer (Catches all broken links and fixes them)
    re_path(r'^(?P<path>.*)$', CatchAllAssetProxy),
]

