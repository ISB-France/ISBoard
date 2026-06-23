import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_phone(value):
    if not value:
        return
    cleaned = re.sub(r"[\s\-\+\.\(\)]", "", value)
    if not re.match(r"^0\d{9}$", cleaned):
        raise ValidationError(
            _("Le numéro de téléphone doit être au format français (ex: 0612345678)"),
        )
