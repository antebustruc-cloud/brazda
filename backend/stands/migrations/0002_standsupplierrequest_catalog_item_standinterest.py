from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0001_initial'),
        ('stands', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # StandSupplierRequest had no per-product FK originally.
        # No real rows have ever been created (the feature was never exposed in any UI),
        # so we clear the table and add the new schema cleanly.
        migrations.RunSQL(
            sql='DELETE FROM stands_standsupplierrequest;',
            reverse_sql=migrations.RunSQL.noop,
        ),

        # Add catalog_item (per-product supply request)
        migrations.AddField(
            model_name='standsupplierrequest',
            name='catalog_item',
            field=models.ForeignKey(
                help_text='The specific product the stand wants to sell from this farmer',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='supplier_requests',
                to='catalog.productcatalog',
                null=True,  # temporarily nullable for the migration
            ),
        ),

        # Make catalog_item non-nullable now that all rows have values (there are none)
        migrations.AlterField(
            model_name='standsupplierrequest',
            name='catalog_item',
            field=models.ForeignKey(
                help_text='The specific product the stand wants to sell from this farmer',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='supplier_requests',
                to='catalog.productcatalog',
            ),
        ),

        # Add responded_at
        migrations.AddField(
            model_name='standsupplierrequest',
            name='responded_at',
            field=models.DateTimeField(blank=True, null=True),
        ),

        # Enforce unique per stand+farmer+catalog_item
        migrations.AlterUniqueTogether(
            name='standsupplierrequest',
            unique_together={('stand', 'farmer', 'catalog_item')},
        ),

        # New: StandInterest (buyer taps "I'm interested" on a stand)
        migrations.CreateModel(
            name='StandInterest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('surveyed_at', models.DateTimeField(blank=True, null=True)),
                ('buyer', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='stand_interests',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('stand', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='interests',
                    to='stands.stand',
                )),
            ],
            options={
                'unique_together': {('buyer', 'stand')},
            },
        ),
    ]
