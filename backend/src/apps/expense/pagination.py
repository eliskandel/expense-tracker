from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10  # default
    page_size_query_param = 'page_size'  # client can pass ?page_size=20
    max_page_size = 100  # maximum allowed
