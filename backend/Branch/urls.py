from django.urls import include, path
from .views import get_branch, new_branch, update_branch, list_branches, delete_branch
urlpatterns = [
    path('', list_branches, name='branch_list'),
    path('new/',new_branch,name = 'new_branch'),
    path('get/<str:sucurCod>/',get_branch,name = 'get_branch'),
    path('update/<str:sucurCod>/',update_branch,name = 'update_branch'),
    path('delete/<str:sucurCod>/',delete_branch,name = 'delete_branch'),

]