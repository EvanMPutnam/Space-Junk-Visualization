'''
sgp4 library dependency is needed.  Originally it was used to handle all computations for
two line elements and they would constantly be updated to the client via ajax.
This was computationally expensive and it prooved far more efficient to run the tle
calculations with satellite.js in the client.
'''
from sgp4.earth_gravity import wgs72
from sgp4.io import twoline2rv
import datetime
import utils.satellite_data_fetch as sat


class Satellite:
    def __init__(self, line1, line2):
        self.tle_obj = twoline2rv(line1, line2, wgs72)
    
    def get_sat_num(self, addition=""):
        return str(self.tle_obj.satnum) + addition



def get_initial_satellites(needs_update=False):
    satellite_dict = {"satellites" : {}, "duplicates": 0}
    if needs_update:
        sat.process_current_date()
    
    line1 = None
    line2 = None
    sat = None
    count = 0
    duplicates = 0
    with open("utils/current.txt") as tle_file:
        for line in tle_file:
            if count % 2 == 0:
                line1 = line.strip()
            else:
                line2 = line.strip()
                sat = Satellite(line1, line2)
                addition = ""
                #Just a way of dealing with numbers that are the same...  (They should not be)
                while True:
                    if sat.get_sat_num(addition) in satellite_dict:
                        addition += "_1"
                        duplicates += 1
                    else:
                        satellite_dict["satellites"][sat.get_sat_num(addition)] = {"line1" : line1, "line2" : line2}
                        break
            count += 1
    satellite_dict["duplicates"] = duplicates
    return satellite_dict



