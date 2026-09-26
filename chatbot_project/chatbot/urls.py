from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('chat/', views.chat, name='chat'),
    path('chat/ajax', views.chat_ajax, name='chat_ajax'),
]