from django.db import models

# Create your models here.
class Income(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    source = models.CharField(max_length=100)
    user=models.ForeignKey('auth.User', on_delete=models.CASCADE)
    date = models.DateField()

    def __str__(self):
        return f"Income from {self.source} - {self.amount}"
