import requests
import sys

# Configuration
DASHBOARD_URL = "http://localhost:5173"
CLIENT_URL = "http://localhost:5174"
WIDGET_PAGE_URL = f"{CLIENT_URL}/test.html"
BACKEND_URL = "http://localhost:8000/api/"
TOKEN_URL = f"{BACKEND_URL}token/"

# Test credentials
CREDENTIALS = {
    "username": "admin",
    "password": "adminpassword"
}

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log_success(message):
    print(f"{Colors.OKGREEN}[SUCCESS]{Colors.ENDC} {message}")

def log_info(message):
    print(f"{Colors.OKBLUE}[INFO]{Colors.ENDC} {message}")

def log_warning(message):
    print(f"{Colors.WARNING}[WARNING]{Colors.ENDC} {message}")

def log_error(message, error_detail=None):
    print(f"{Colors.FAIL}[ERROR]{Colors.ENDC} {message}")
    if error_detail:
        print(f"        Detail: {error_detail}")

def check_service(name, url, expected_status=(200,)):
    log_info(f"Checking {name} at {url}...")
    try:
        response = requests.get(url, timeout=5)
        if response.status_code in expected_status:
            log_success(f"{name} is reachable (Status: {response.status_code})")
            return True
        else:
            log_error(f"{name} returned unexpected status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        log_error(f"Could not connect to {name}. Is the service running?")
        return False
    except Exception as e:
        log_error(f"An error occurred while checking {name}", str(e))
        return False

def check_jwt_auth():
    log_info(f"Attempting JWT Token acquisition at {TOKEN_URL}...")
    try:
        response = requests.post(TOKEN_URL, json=CREDENTIALS, timeout=5)
        if response.status_code == 200:
            log_success("JWT Token obtained successfully. Database and Migrations are OK.")
            return True
        elif response.status_code == 401:
            log_warning("Backend is UP, but credentials failed (HTTP 401).")
            return True 
        else:
            log_error(f"JWT Endpoint returned error: {response.status_code}")
            return False
    except Exception as e:
        log_error("An error occurred during JWT check", str(e))
        return False

def run_health_check():
    print(f"{Colors.BOLD}{Colors.HEADER}=== SaaS Chat System Health Check ==={Colors.ENDC}\n")
    
    results = []
    
    # 1. Dashboard Frontend
    results.append(check_service("Dashboard Frontend", DASHBOARD_URL))
    
    # 2. Client Frontend (Root)
    results.append(check_service("Client Frontend (Root)", CLIENT_URL))
    
    # 3. Widget Page (test.html)
    results.append(check_service("Widget Test Page", WIDGET_PAGE_URL))
    
    # 4. Backend API
    results.append(check_service("Backend API", BACKEND_URL, expected_status=(200, 401, 403, 404)))
    
    # 5. JWT & DB Check
    results.append(check_jwt_auth())
    
    print(f"\n{Colors.BOLD}=== Summary ==={Colors.ENDC}")
    if all(results):
        log_success("All core services and pages are responding correctly!")
    else:
        log_warning("Some services reported issues. Check the logs above.")

if __name__ == "__main__":
    run_health_check()
