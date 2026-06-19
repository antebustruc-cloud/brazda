from django.db import models

class ProductCatalog(models.Model):
    CATEGORY_CHOICES = [
        ('fruit', 'Fruit'),
        ('vegetable', 'Vegetable'),
        ('herb', 'Herb'),
        ('other', 'Other'),
    ]
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    image = models.ImageField(upload_to='catalog/', null=True, blank=True)

    def __str__(self):
        return self.name

class ProductVariety(models.Model):
    catalog_item = models.ForeignKey(ProductCatalog, on_delete=models.CASCADE, related_name='varieties')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.catalog_item.name} - {self.name}"