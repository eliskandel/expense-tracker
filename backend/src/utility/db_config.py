import json
import os


class DBConfigHandler:
    def __init__(self):
        pass

    @staticmethod
    def get_db_config_for_current_env():
        file_name = "local.json"
        if not os.path.isfile(file_name):
            return {}
        with open(file_name, "r") as fp:
            return json.load(fp)