import os
import re

from django.core.exceptions import ValidationError

def image_validate(image):
    check_exts = (".jpg", ".jpeg", ".png")
    file_extension= os.path.splitext(str(image))
    if image.size >= 1000000:
        raise ValidationError("File should less then 1MB")
    if file_extension[1] == check_exts[0] or file_extension[1] == check_exts[1] or file_extension[1] == check_exts[2]:
        pass
    else:
        raise ValidationError("Provide Valid Image file such as jpeg, jpg, png")
    if image:
        pass
    else:
        raise ValidationError("Image is not provided")
    


def modify_string(input_string) -> str:
    # Replace spaces with hyphens
    replaced_string = input_string.replace(' ', '-')

    # Remove special characters using regular expression
    cleaned_string = re.sub(r'[^\w\s-]', '', replaced_string)
    return cleaned_string