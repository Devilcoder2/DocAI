from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Create connection pool engine using settings configs
# We pass SQLite-specific arguments if using a local SQLite file for development
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

# Local session factory to spawn database transaction sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base model class from which all database models inherit
Base = declarative_base()

def get_db():
    """
    Generator function yielding active transactional database sessions.
    Properly releases and closes session resources upon task completion.

    Inputs:
        None

    Outputs:
        db (Session): SQLAlchemy active transactional database connection.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
