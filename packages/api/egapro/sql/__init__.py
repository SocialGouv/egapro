from pathlib import Path


def load():
    """Load SQL strings, in order to do `sql.my_query` for a file named `my_query`."""
    for path in Path(__file__).parent.iterdir():
        if path.suffix == ".sql":
            query = path.read_text()
            globals()[path.stem] = query


load()
