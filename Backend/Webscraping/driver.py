"""
Shared headless Chrome factory for all scrapers.

Environment:
  CHROME_BINARY          path to Chrome/Chromium if Selenium cannot find it
  CHROMEDRIVER_PATH      path to chromedriver (otherwise Selenium Manager resolves it)
  TUFF_PAGE_LOAD_TIMEOUT seconds before driver.get() gives up (default 30)
"""
import os

from selenium import webdriver
from selenium.webdriver.chrome.service import Service


def make_chrome(options):
    binary = os.getenv('CHROME_BINARY')
    if binary:
        options.binary_location = binary
    driver_path = os.getenv('CHROMEDRIVER_PATH')
    service = Service(executable_path=driver_path) if driver_path else None
    driver = webdriver.Chrome(options=options, service=service)
    driver.set_page_load_timeout(int(os.getenv('TUFF_PAGE_LOAD_TIMEOUT', '30')))
    return driver
