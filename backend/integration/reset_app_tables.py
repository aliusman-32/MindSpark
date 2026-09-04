"""
One-off maintenance script: fixes the MindSpark MySQL database schema.

The 'MindSpark' database was created from an older/incompatible schema:
most primary keys were missing AUTO_INCREMENT, which made every INSERT
(signup, lesson creation, etc.) fail with:
    (1364, "Field '...' doesn't have a default value")

This script drops only the 8 tables that backend/integration/database.py
actually defines, then recreates them from the current SQLAlchemy models
(via Base.metadata.create_all), which sets AUTO_INCREMENT correctly.

It does NOT touch any other tables in the database (e.g. legacy/unused
tables like quizzes, questions, answer_options, etc.).

Usage:
    cd backend/integration
    python reset_app_tables.py
"""
import os
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

from database import Base, engine

# Drop children before parents to satisfy foreign key constraints.
TABLES_IN_DROP_ORDER = [
    "assessment_results",
    "quiz_attempts",
    "lesson_quizzes",
    "visual_lessons",
    "content_prompts",
    "child_profiles",
    "categories",
    "users",
]


def main():
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        for table in TABLES_IN_DROP_ORDER:
            print(f"Dropping table if exists: {table}")
            conn.execute(text(f"DROP TABLE IF EXISTS `{table}`"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
        conn.commit()

    print("Recreating tables from SQLAlchemy models...")
    Base.metadata.create_all(bind=engine)
    print("Done. Tables now match backend/integration/database.py, with correct AUTO_INCREMENT.")


if __name__ == "__main__":
    main()
