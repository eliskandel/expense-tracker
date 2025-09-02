from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from decimal import Decimal
from .models import ChatMessage
from .ai_service import FinancialAIService
from .serializers import ChatMessageSerializer, ChatRequestSerializer


def convert_decimals_to_float(data):
    """Recursively convert Decimal objects to float for JSON serialization"""
    if isinstance(data, dict):
        return {key: convert_decimals_to_float(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_decimals_to_float(item) for item in data]
    elif isinstance(data, Decimal):
        return float(data)
    else:
        return data


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_with_ai(request):
    """
    Handle chat messages with AI
    Expects: {"message": "user message"}
    Returns: {"ai_response": "response", "context_used": {...}}
    """
    serializer = ChatRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user_message = serializer.validated_data['message']
    user = request.user

    try:
        # Initialize AI service
        ai_service = FinancialAIService()
        
        # Get user's financial context
        user_context = ai_service.get_user_financial_context(user)
        
        # Convert Decimals to floats for JSON serialization
        serializable_context = convert_decimals_to_float(user_context)
        
        # Save user message
        user_chat = ChatMessage.objects.create(
            user=user,
            message=user_message,
            message_type='user',
            context_data=serializable_context  # Now JSON serializable
        )
        
        # Get AI response
        ai_response = ai_service.get_ai_response_sync(user_message, user_context)
        
        # Save AI response
        ai_chat = ChatMessage.objects.create(
            user=user,
            message=ai_response,
            message_type='ai',
            context_data=serializable_context
        )
        
        return Response({
            'ai_response': ai_response,
            'context_used': serializable_context,
            'user_message_id': user_chat.id,
            'ai_message_id': ai_chat.id,
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': 'Failed to generate AI response',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_history(request):
    """
    Get user's chat history
    Optional query params: 
    - limit: number of messages (default: 50)
    """
    limit = int(request.GET.get('limit', 50))
    
    messages = ChatMessage.objects.filter(
        user=request.user
    ).order_by('-timestamp')[:limit]
    
    # Reverse to get chronological order
    messages = list(reversed(messages))
    
    serializer = ChatMessageSerializer(messages, many=True)
    
    return Response({
        'messages': serializer.data,
        'total_count': ChatMessage.objects.filter(user=request.user).count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_financial_summary(request):
    """
    Get user's financial summary for the AI context
    Useful for debugging or showing users what data AI sees
    """
    try:
        ai_service = FinancialAIService()
        user_context = ai_service.get_user_financial_context(request.user)
        
        # Convert Decimals for JSON response
        serializable_context = convert_decimals_to_float(user_context)
        
        return Response({
            'financial_summary': serializable_context,
            'summary_generated_at': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': 'Failed to generate financial summary',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)