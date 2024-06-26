

export const propTypes = [
    'Edm.Int16',
    'Edm.Int32',
    'Edm.Int64',
    'Edm.Boolean',
    'Edm.String',
    'Edm.Date',
    'Edm.Single',
    'Edm.Double',
    'Edm.Decimal',
    'Edm.TimeOfDay',
    'Edm.DateTimeOffset',
    'Edm.Byte',
    'Edm.Binary',
    'Edm.Duration'
];

export const knownActions = [
    "query",
    "count",
    "insert",
    "update",
    "remove"
];

export const allowedQueryOptions = ['$', '$filter', '$expand', '$select', '$orderby', '$top', '$skip', '$count', '$format'];