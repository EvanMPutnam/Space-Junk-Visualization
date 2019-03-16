from dateutil import parser

def calc_date(date_str):
    try:
        dt = parser.parse(date_str)
        return dt
    except:
        return None