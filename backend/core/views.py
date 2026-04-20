import json
import re
import secrets
from urllib.parse import urlparse

from django.contrib.auth.models import User
from django.db.models import Q
from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status, viewsets, renderers
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from revproxy.views import ProxyView

from .models import Microservice, State, UserServiceAccount, AuditLog, Profile
from .serializers import (MicroserviceSerializer, StateSerializer,
                          UserServiceAccountSerializer, UserSerializer, AuditLogSerializer)

def log_action(user, action, details=None, request=None):
    ip = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
    AuditLog.objects.create(user=user, action=action, details=details, ip_address=ip)

# --- STEALTH GATEWAY 16.0 (POST GUARDIAN) ---

class ServiceProxyView(ProxyView):
    upstream = None
    add_remote_user = True

    def get_proxy_request_headers(self, request):
        headers = super().get_proxy_request_headers(request)
        target_p = urlparse(self.upstream)
        headers['Host'] = target_p.netloc
        headers['Referer'] = f"{target_p.scheme}://{target_p.netloc}/"
        headers['Accept'] = request.META.get('HTTP_ACCEPT', '*/*')
        if hasattr(self, 'assignment') and self.assignment.session_cookies:
            try:
                v = json.loads(self.assignment.session_cookies)
                stored_c = "; ".join([f"{k}={v}" for k, v in v.items()])
                headers['Cookie'] = f"{headers.get('Cookie', '')}; {stored_c}".strip('; ')
            except: pass
        return headers

    def dispatch(self, request, path, assignment_id):
        self.assignment = get_object_or_404(UserServiceAccount, id=assignment_id)
        parsed = urlparse(self.assignment.microservice.url)
        self.upstream = f"{parsed.scheme}://{parsed.netloc}"
        path = f"/{path.lstrip('/')}"
        
        response = super().dispatch(request, path)

        if 'Set-Cookie' in response:
            try:
                ex = json.loads(self.assignment.session_cookies or '{}')
                raw = response.getlist('Set-Cookie') if hasattr(response, 'getlist') else [response['Set-Cookie']]
                for c in raw:
                    p = c.split(';')[0].split('=')
                    if len(p) >= 2: ex[p[0].strip()] = p[1].strip()
                self.assignment.session_cookies = json.dumps(ex); self.assignment.save()
            except: pass

        loc = response.get('Location') or response.get('location')
        if loc and response.status_code in [301, 302, 303, 307, 308]:
            p_prefix = f"/sso-system/proxy/{assignment_id}/"
            if loc.startswith('/'): response['Location'] = f"{p_prefix}{loc.lstrip('/')}"
            elif parsed.netloc in loc: response['Location'] = loc.replace(f"{parsed.scheme}://{parsed.netloc}", p_prefix.rstrip('/'))

        c_type = response.get('Content-Type', '').lower()
        if 'text/html' in c_type:
             if any(ext in request.path.lower() for ext in ['.css', '.js', '.png', '.jpg', '.ico']):
                  return HttpResponse(status=404, content_type="text/plain")
             try:
                html = response.content.decode('utf-8', errors='ignore')
                html = re.sub(r'<meta[^>]*Content-Security-Policy[^>]*>', '', html, flags=re.I)
                html = re.sub(r'<meta[^>]*X-Frame-Options[^>]*>', '', html, flags=re.I)
                p_root = f"/sso-system/proxy/{assignment_id}/"
                inj = f"""
                <script id="sso-core">
                    (function() {{
                        const p_root = "{p_root}";
                        console.log("SSO: Action Lock V16 active.");
                        if(!window._sanc) {{ const b = document.createElement('base'); b.href = p_root; document.head.prepend(b); window._sanc=1; }}
                        const u = "{self.assignment.username}"; const p = "{self.assignment.password}";
                        const drive = async (el, v) => {{
                            if (!el || el.value === v) return;
                            el.focus(); if(el.click) el.click();
                            const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                            if (s) s.call(el, ""); else el.value = "";
                            document.execCommand('insertText', false, v);
                            ['input', 'change', 'blur'].forEach(n => el.dispatchEvent(new Event(n, {{bubbles:true}})));
                        }};
                        const scan = async () => {{
                            if (window._ssol || window.location.href.includes('dashboard')) return;
                            const user = document.querySelector('#email, input[id*="user"], input[name*="user"], input[name*="phone"], input[type="tel"], input[type="text"]');
                            const pass = document.querySelector('#pv_id_9, [type="password"], [name*="pass"]');
                            const btn = document.querySelector('button[type="submit"], [type="submit"], .p-button, button.login-btn, [class*="submit"]');
                            if (user && pass && btn) {{
                                 if (user.value !== u) await drive(user, u);
                                 if (pass.value !== p) await drive(pass, p);
                                 if (user.value === u && pass.value === p) {{ 
                                     window._ssol=1; setTimeout(()=>{{ if(btn.offsetParent) btn.click(); }}, 600); 
                                 }}
                            }}
                        }};
                        setInterval(scan, 800);
                    }})();
                </script>
                """
                if '</head>' in html: html = html.replace('</head>', inj + '</head>')
                else: html = inj + html
                html = re.sub(r'action=["\']/(?!/)', f'action="{p_root}', html)
                html = re.sub(r'src=["\']/(?!/)', f'src="{p_root}', html)
                html = re.sub(r'href=["\']/(?!/)', f'href="{p_root}', html)
                response.content = html.encode('utf-8'); response['Content-Length'] = str(len(response.content))
             except: pass
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        for h in ['Content-Security-Policy', 'X-Frame-Options', 'Strict-Transport-Security']:
            if h in response: del response[h]
            if h.lower() in response: del response[h.lower()]
        response.set_cookie('last_proxy_id', assignment_id, path='/', samesite='Lax')
        return response

@csrf_exempt
def CatchAllAssetProxy(request, path):
    match = re.search(r'proxy/(\d+)/', request.path)
    p_id = match.group(1) if match else request.COOKIES.get('last_proxy_id')
    
    # 1. TRANSPARENT FORWARDING (NO REDIRECTS FOR POST)
    if p_id and not match:
         t_path = request.path
         if t_path.startswith('/sso-system/'): t_path = t_path.replace('/sso-system/', '', 1)
         # SILENT DISPATCH: Directly call the proxy view without a 302 redirect
         return ServiceProxyView.as_view()(request, assignment_id=p_id, path=t_path.lstrip('/'))

    p_path = path
    if p_id and f"proxy/{p_id}/" in request.path: p_path = request.path.split(f"proxy/{p_id}/")[1]
    if p_id: return ServiceProxyView.as_view()(request, assignment_id=p_id, path=p_path)
    return HttpResponseNotFound("Session Context Lost.")

# --- DATA ---

class LaunchView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, assignment_id):
        a = get_object_or_404(UserServiceAccount, id=assignment_id)
        log_action(a.user, "Service Launch", f"Launched {a.microservice.name}", request)
        r = redirect(f"/sso-system/proxy/{assignment_id}/")
        r.set_cookie('last_proxy_id', assignment_id, path='/', samesite='Lax')
        return r

class UserDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        s = UserServiceAccount.objects.filter(user=request.user).select_related('microservice')
        return Response(UserServiceAccountSerializer(s, many=True).data)

class LoginView(ObtainAuthToken):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        try:
            u = User.objects.get(username=request.data['username'])
            if not u.is_active:
                return Response({'error': 'Your account has been deactivated. Please contact an administrator.'}, status=403)
                
            if u.check_password(request.data['password']):
                log_action(u, "Login", "User logged in via portal", request)
                t, _ = Token.objects.get_or_create(user=u)
                full_name = f"{u.first_name} {u.last_name}".strip() or u.username
                import base64
                photo = None
                if hasattr(u, 'profile') and u.profile.photo:
                    photo = base64.b64encode(u.profile.photo).decode('utf-8')

                return Response({
                    'token': t.key, 
                    'user_id': u.pk, 
                    'email': u.email, 
                    'name': full_name,
                    'is_staff': u.is_staff,
                    'photo': photo,
                    'custom_hue': getattr(u.profile, 'custom_hue', 335) if hasattr(u, 'profile') else 335
                })
        except User.DoesNotExist:
            pass
        return Response({'error': 'Invalid credentials'}, status=400)

class MicroserviceViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]; queryset = Microservice.objects.all(); serializer_class = MicroserviceSerializer

class UserServiceAccountViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = UserServiceAccount.objects.all().select_related('user', 'microservice')
    serializer_class = UserServiceAccountSerializer

    def create(self, request, *args, **kwargs):
        # Implement Upsert (Update or Create) logic
        user_id = request.data.get('user')
        ms_id = request.data.get('microservice')
        
        if not user_id or not ms_id:
            return Response({"error": "User and Microservice IDs required"}, status=400)

        obj, created = UserServiceAccount.objects.update_or_create(
            user_id=user_id,
            microservice_id=ms_id,
            defaults={
                'username': request.data.get('username', ''),
                'password': request.data.get('password', '')
            }
        )
        serializer = self.get_serializer(obj)
        return Response(serializer.data, status=201 if created else 200)

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        custom_hue = self.request.data.get('custom_hue')
        if custom_hue is not None:
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.custom_hue = int(custom_hue)
            profile.save()
        log_action(self.request.user, "User Created", f"Created user: {user.username}", self.request)

    def perform_update(self, serializer):
        user = serializer.save()
        custom_hue = self.request.data.get('custom_hue')
        if custom_hue is not None:
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.custom_hue = int(custom_hue)
            profile.save()
        log_action(self.request.user, "User Updated", f"Updated user: {user.username}", self.request)

    def perform_destroy(self, instance):
        username = instance.username
        instance.delete()
        log_action(self.request.user, "User Deleted", f"Deleted user: {username}", self.request)

class StateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]; queryset = State.objects.all(); serializer_class = StateSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
        
    def patch(self, request):
        user = request.user
        data = request.data
        
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'email' in data: user.email = data['email']
        
        user.save()

        # Handle Photo Upload (BLOB storage)
        if 'photo' in data and data['photo']:
            import base64
            try:
                # Remove header if present (e.g., data:image/png;base64,)
                photo_str = data['photo']
                if ';base64,' in photo_str:
                    photo_str = photo_str.split(';base64,')[1]
                
                photo_data = base64.b64decode(photo_str)
                profile, _ = Profile.objects.get_or_create(user=user)
                profile.photo = photo_data
                profile.save()
            except Exception as e:
                return Response({"error": f"Failed to save photo: {str(e)}"}, status=400)
            
        log_action(user, "Profile Updated", "User updated their own profile", request)
        return Response(UserSerializer(user).data)
