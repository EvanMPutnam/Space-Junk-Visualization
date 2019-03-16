import requests



def request_satellite_data():
    json_data = {}
    for i in range():
        pass
    result = requests.post("http://0.0.0.0:8080/update/now", json=json_data)
    if result.ok:
        print(result.json)

def request_empty_data():
    json_data = None
    result = requests.post("http://0.0.0.0:8080/update/now", json=json_data)
    if result.ok:
        print(result.json)
    


if __name__ == "__main__":
    pass
#request_satellite_data()


