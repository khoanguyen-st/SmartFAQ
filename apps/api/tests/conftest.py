"""Pytest configuration and fixtures."""
import os
import pytest

# Set GOOGLE_API_KEY environment variable before any tests run
os.environ["GOOGLE_API_KEY"] = "AIzaSyD--ApjG85vCh1-EH7YhWrAhYZmMFThSOo"


@pytest.fixture(scope="session", autouse=True)
def setup_google_api_key():
    """
    Setup Google API key for all tests.
    This fixture runs automatically before any test.
    """
    os.environ["GOOGLE_API_KEY"] = "AIzaSyD--ApjG85vCh1-EH7YhWrAhYZmMFThSOo"
    yield
    # Cleanup after all tests (optional)
    pass
