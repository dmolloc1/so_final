from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/dashboard/(?P<user_id>\w+)/(?P<branch_id>\w+)/$', consumers.DashboardConsumer.as_asgi()),
]