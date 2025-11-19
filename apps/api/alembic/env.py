# apps/api/alembic/env.py
from __future__ import annotations
import sys
import os
from logging.config import fileConfig
from dotenv import load_dotenv

from sqlalchemy import engine_from_config, pool
from alembic import context

# Load .env so DATABASE_URL (if any) is available
load_dotenv()

# Alembic config
config = context.config

# If DATABASE_URL set in .env, override alembic.ini
database_url = os.getenv("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# -- make sure Alembic can import your app package --
# Adjust this path if your package root is elsewhere.
# Here we assume your project layout puts package 'app' under:
#  D:\SmartFAQ\SmartFAQ\apps\api  (where you run alembic)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import your Base (the declarative base) so autogenerate can inspect models.
# Adjust the import path if Base lives somewhere else.
try:
    from app.models.config import Base  # <-- đảm bảo đây đúng chỗ bạn khai Base
except Exception as exc:
    raise ImportError(
        "Could not import Base from app.models.config. "
        "Check the import path and that your PYTHONPATH is correct."
    ) from exc

target_metadata = Base.metadata

# Optionally set other compare flags to detect server defaults/type changes
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
