from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import ChatMessage
import random
from langdetect import detect

def home(request):
    chat_history = ChatMessage.objects.all().order_by('-timestamp')[:5]
    return render(request, 'chatbot/home.html', {'chat_history': chat_history})


import datetime
def get_bot_response(user_message):
    from openai import OpenAI
    try:
        detected_lang = detect(user_message)
        print(f"Detected language: {detected_lang}")
    except Exception as e:
        detected_lang = "en"
    user_message_lower = user_message.lower()
    time_keywords_en = ["what is the time", "current time", "time now","today date"]
    date_keywords_en = ["what is the date", "today's date", "date today"]
    time_keywords_hi = ["कितने बजे", "अभी समय", "समय", "बजे", "समय क्या है", "अब कितने बजे"]
    date_keywords_hi = ["आज की तारीख", "तारीख", "आज कौन सी तारीख है", "तारीख क्या है"]
    if detected_lang == "en":
        if any(keyword in user_message_lower for keyword in time_keywords_en):
            current_time = datetime.datetime.now().strftime("%I:%M %p")
            return f"The current time is {current_time}."
        if any(keyword in user_message_lower for keyword in date_keywords_en):
            current_date = datetime.datetime.now().strftime("%A, %B %d, %Y")
            return f"Today's date is {current_date}."
    if detected_lang == "hi":
        if any(keyword in user_message_lower for keyword in time_keywords_hi):
            current_time = datetime.datetime.now().strftime("%I:%M %p")
            return f"अभी समय है {current_time}।"
        if any(keyword in user_message_lower for keyword in date_keywords_hi):
            current_date = datetime.datetime.now().strftime("%A, %d %B %Y")
            return f"आज की तारीख है {current_date}।"
    try:
        client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key="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",
        )
        completion = client.chat.completions.create(
            model="moonshotai/Kimi-K2-Instruct:novita",
            messages=[{"role": "user", "content": user_message}],
        )
        return completion.choices[0].message.content
    except Exception as e:
        return random.choice([
            "I'm having trouble connecting to my brain right now. Please try again later.",
            "Sorry, I encountered an error while processing your request.",
            "My neural networks are experiencing some issues. Could you try again?"
        ])

def chat(request):
    if request.method == 'POST':
        user_message = request.POST.get('user_message', '')
        print(f"Received message: {user_message}")
        print(f"Accept header: {request.META.get('HTTP_ACCEPT', '')}")
        if user_message:
            bot_response = get_bot_response(user_message)
            print(f"Bot response: {bot_response}")
            ChatMessage.objects.create(
                user_message=user_message,
                bot_response=bot_response
            )  
            return redirect('home')
    return redirect('home')

def chat_ajax(request):
    print(f"AJAX request received: {request.method}")
    print(f"Content type: {request.content_type}")
    if request.method == 'POST':
        print(f"POST data: {request.POST}")
        user_message = request.POST.get('user_message', '')
        print(f"User message: '{user_message}'")
        if user_message:
            bot_response = get_bot_response(user_message)
            print(f"Bot response: '{bot_response}'")
            ChatMessage.objects.create(
                user_message=user_message,
                bot_response=bot_response
            )     
            return JsonResponse({
                'bot_response': bot_response
            })
        else:
            print("No user message found in POST data")
    else:
        print(f"Unexpected request method: {request.method}") 
    return JsonResponse({'error': 'Invalid request'}, status=400)

