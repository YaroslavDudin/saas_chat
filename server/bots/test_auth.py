from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User

class AuthTests(APITestCase):
    def test_registration_success(self):
        url = reverse('api-register')
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'StrongPassword123!'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'newuser')

    def test_registration_duplicate_username(self):
        User.objects.create_user(username='existinguser', password='password123', email='old@example.com')
        url = reverse('api-register')
        data = {
            'username': 'existinguser',
            'email': 'another@example.com',
            'password': 'StrongPassword123!'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_registration_duplicate_email(self):
        User.objects.create_user(username='olduser', password='password123', email='duplicate@example.com')
        url = reverse('api-register')
        data = {
            'username': 'newuser',
            'email': 'duplicate@example.com',
            'password': 'StrongPassword123!'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_registration_weak_password(self):
        url = reverse('api-register')
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': '123'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_login_success(self):
        User.objects.create_user(username='loginuser', password='password123', email='login@example.com')
        url = reverse('api_token_auth')
        data = {
            'username': 'loginuser',
            'password': 'password123'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
