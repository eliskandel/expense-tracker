import inspect
import logging
import os
import sys
import traceback
from inspect import currentframe
from typing import Union

from src.utility.singletone import SingletonMeta


def get_filename(filename):
    file_name = os.path.basename(filename)
    return os.path.splitext(file_name)[0]


def get_linenumber():
    try:
        return sys.exc_info()[2].tb_lineno  # type:ignore
    except Exception:
        cf = currentframe()
        if cf and cf.f_back:
            return cf.f_back.f_lineno
        return 0


class Logger(metaclass=SingletonMeta):
    def __init__(self):
        self.app_logger = logging.getLogger("logger")

    def write_message(
        self,
        level: str,
        message: str,
        filename: Union[str, None] = None,
        class_name: Union[str, None] = None,
        func: Union[str, None] = None,
        lineno=None,
    ) -> None:
        try:
            frame = inspect.currentframe()
            caller_frame = inspect.getouterframes(frame, 2)[1]
            if not filename:
                filename = get_filename(caller_frame.filename)
            if not lineno:
                lineno = caller_frame.lineno
                if level == "exception":
                    level = "error"
                    traceback_details = traceback.extract_tb(sys.exc_info()[2])
                    if traceback_details:
                        last_frame = traceback_details[-1]
                        lineno = last_frame.lineno
            if not class_name:
                if "self" in caller_frame.frame.f_locals:
                    class_name = caller_frame.frame.f_locals["self"].__class__.__name__
                else:
                    class_name = caller_frame.function
            if not func:
                if "request" in caller_frame.frame.f_locals:
                    func = caller_frame.frame.f_locals["request"].method

            extra_dict = {
                "fileName": filename,
                "className": class_name,
                "methodName": func,
                "lineNo": lineno,
            }
            if level == "info":
                self.app_logger.info(message, extra=extra_dict)
            elif level == "warning":
                self.app_logger.warning(message, extra=extra_dict)
            elif level == "error":
                self.app_logger.error(message, extra=extra_dict)
            else:
                self.app_logger.debug(message, extra=extra_dict)
        except Exception as e:
            print(str(e))
            pass

    def get_request_start_log(
        self,
        filename: str | None,
        class_name: str | None,
        method_type: str | None,
        lineno: int | None,
    ) -> None:
        try:
            self.write_message(
                level="info",
                class_name=class_name,
                func=method_type,
                message="In the start.",
                filename=filename,
                lineno=lineno,
            )
        except Exception as e:
            print(str(e))
            pass

    def get_request_save_update_log(
        self,
        filename: str | None,
        class_name: str | None,
        message: str,
        method_type: str | None,
        lineno: int | None,
    ) -> None:
        try:
            self.write_message(
                level="info",
                class_name=class_name,
                func=method_type,
                message=message,
                filename=filename,
                lineno=lineno,
            )
        except Exception as e:
            print(str(e))
            pass

    def get_request_warning_log(
        self,
        filename: str | None,
        class_name: str | None,
        message: str,
        method_type: str | None,
        lineno: int | None,
    ) -> None:
        try:
            self.write_message(
                level="warning",
                class_name=class_name,
                func=method_type,
                message=message,
                filename=filename,
                lineno=lineno,
            )
        except Exception as e:
            print(str(e))
            pass

    def get_request_end_log(
        self,
        filename: str | None,
        class_name: str | None,
        method_type: str | None,
        lineno: int | None,
    ) -> None:
        try:
            self.write_message(
                level="info",
                class_name=class_name,
                func=method_type,
                message="In the end.",
                filename=filename,
                lineno=lineno,
            )
        except Exception as e:
            print(str(e))
            pass

    def get_request_error_log(
        self,
        filename: str | None,
        class_name: str | None,
        message: str,
        method_type: str | None,
        lineno: int | None,
    ) -> None:
        try:
            self.write_message(
                level="error",
                class_name=class_name,
                func=method_type,
                message=message,
                filename=filename,
                lineno=lineno,
            )
        except Exception as e:
            print(str(e))
            pass


logger: Logger = Logger()