"""
Simple start script for backend server (no local ML model loading).
"""
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


def check_dependencies():
    """Check if required packages are installed."""
    logger.info("Checking dependencies...")

    required_packages = [
        'flask',
        'requests',
        'beautifulsoup4',
        'opencv-python',
        'pytesseract'
    ]

    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing.append(package)

    if missing:
        logger.error(f"Missing packages: {', '.join(missing)}")
        logger.info("Install with: pip install -r requirements.txt")
        return False

    logger.info("All dependencies installed")
    return True


def setup_environment():
    """Setup environment file if it doesn't exist."""
    env_file = Path('.env')
    example_file = Path('.env.example')

    if not env_file.exists() and example_file.exists():
        logger.info("Creating .env file from template...")
        env_file.write_text(example_file.read_text())
        logger.info(".env file created")


def start_server():
    """Start Flask server."""
    logger.info("\nStarting backend server")
    logger.info("Backend will be available at: http://localhost:5000")
    logger.info("Press Ctrl+C to stop the server\n")

    from app import app
    app.run(host='0.0.0.0', port=5000, debug=True)


def main():
    """Main setup and start routine."""
    logger.info("Fake News Detection Backend - Quick Start")

    if not check_dependencies():
        sys.exit(1)

    setup_environment()

    try:
        start_server()
    except KeyboardInterrupt:
        logger.info("\nServer stopped by user")
    except Exception as e:
        logger.error(f"\nServer error: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
