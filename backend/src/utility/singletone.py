from typing import Any, Dict


class SingletonMeta(type):
    _instances: Dict = {}

    def __call__(cls, *args: Any, **kwargs: Dict):
        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]