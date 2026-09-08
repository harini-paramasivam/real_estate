import os
os.environ['DATABASE_URL'] = 'postgres://test:test@localhost/db'
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Any

class S(BaseSettings):
    database_url: str = 'default'

    @field_validator('database_url', mode='before')
    @classmethod
    def assemble_db_connection(cls, v: Any):
        if not v or not str(v).strip():
            return 'postgresql+psycopg2://postgres:postgres@localhost:5432/real_estate_crm'
        v = str(v).strip('\"\' \t\n\r')
        if v.startswith('postgres://'):
            return v.replace('postgres://', 'postgresql+psycopg2://', 1)
        return v

print(S().database_url)
