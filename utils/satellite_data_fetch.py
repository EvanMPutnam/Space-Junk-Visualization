import os
from datetime import date, timedelta


def process_current_date():
    '''
    Ideally you use this from the command line to update your current.txt file with
    new orbital elements.

    Here is an example below of using space-track (register and replace your information below.)
    '''


    cwd = os.getcwd()
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    today = str(date.today())
    tomorrow = str(date.today()+timedelta(days=1))

    print(today)
    print(tomorrow)

    #Updating a cookies file
    os.system("curl -c cookies.txt -b cookies.txt https://www.space-track.org/ajaxauth/login -d 'identity=someemail@gmail.com&password=somepass'")

    #Formatting a string for system call to get most up to date tle.

    callString = "curl --cookie cookies.txt https://www.space-track.org/basicspacedata/query/class/tle_publish/PUBLISH_EPOCH/"+today+"%2000:00:00--"+tomorrow+"%2000:00:00/orderby/TLE_LINE1/format/tle >"+"current.txt"
    #System call to get tle.
    os.system(callString)


    os.chdir(cwd)


if __name__ == "__main__":
    process_current_date()
