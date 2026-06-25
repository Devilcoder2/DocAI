from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Create connection pool engine for PostgreSQL using setting configs
# We bind this engine to session factories below
engine = create_engine(settings.DATABASE_URL)

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
