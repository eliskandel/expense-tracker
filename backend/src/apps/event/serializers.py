from rest_framework import serializers
from .models import Event, EventExpense

class EventSerializer(serializers.ModelSerializer):
	"""
	Serializer for the Event model.
	It handles converting Event model instances to and from JSON format.
	The 'created_by' field is set as read-only, as it will be assigned automatically by the view.
	"""
	created_by = serializers.ReadOnlyField(source='created_by.username')

	class Meta:
		model = Event
		fields = '__all__'



class EventExpenseSerializer(serializers.ModelSerializer):
	"""
	Serializer for the EventExpense model.
	The 'paid_by' field is read-only because the view will automatically set it to the authenticated user.
	"""
	paid_by = serializers.ReadOnlyField(source='paid_by.username')
	class Meta:
		model = EventExpense
		fields = '__all__'
	
