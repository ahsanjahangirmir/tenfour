from django.core.validators import RegexValidator

driver_number_validator = RegexValidator(
    regex=r"^\d{7}$",
    message="Driver number must be exactly 7 digits.",
)

truck_number_validator = RegexValidator(
    regex=r"^P\d+$",
    message="Truck/tractor number must be in P__ format, e.g. P123456.",
)

trailer_number_validator = RegexValidator(
    regex=r"^T\d+$",
    message="Trailer number must be in T__ format, e.g. T123456.",
)
