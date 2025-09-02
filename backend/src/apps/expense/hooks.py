# Create: your_app/hooks.py
def include_export_endpoints(result, generator, request, public):
    """Custom hook to include export endpoints in schema"""
    # Add manual endpoint definition for export
    result['paths']['/expense/reports/export/'] = {
        'get': {
            'operationId': 'export_expense_data',
            'summary': 'Export Financial Data',
            'description': 'Export expense and income data in various formats',
            'parameters': [
                {
                    'name': 'format',
                    'in': 'query',
                    'required': False,
                    'schema': {'type': 'string', 'enum': ['json', 'csv', 'excel', 'pdf'], 'default': 'json'}
                },
                {
                    'name': 'include_report',
                    'in': 'query',
                    'required': False,
                    'schema': {'type': 'boolean', 'default': False}
                }
            ],
            'responses': {
                '200': {
                    'description': 'Export successful',
                    'content': {
                        'application/json': {},
                        'text/csv': {},
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {},
                        'application/pdf': {}
                    }
                }
            },
            'tags': ['Reports & Export']
        }
    }
    return result