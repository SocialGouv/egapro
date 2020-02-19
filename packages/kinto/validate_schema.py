import argparse
import json
import sys
from jsonschema import Draft7Validator
from jsonschema.exceptions import ValidationError


schema = {}

with open("json-schema.json", "r") as schema_file:
    schema = json.load(schema_file)

# Validate the schema itself: this will raise an exception if it's not well formed
validator = Draft7Validator(schema)
# Make sure the schema isn't completely broken and doesn't validate anything
validation_ok = False
try:
    validator.validate({"foobar": "baz"})
except ValidationError as error:
    print("validation is validating :P")
    validation_ok = True

if not validation_ok:
    print("validation isn't validating anything, exiting")
    exit(1)


def parse(args):
    with open(args.records_path) as records_file:
        records = json.load(records_file)
        if type(records) == dict:
            # It's an export from a HTTP request to Kinto, which returns a json object with a "data" attribute.
            records = records["data"]

        print(f"Validating {len(records)} records")

        num_errors = 0
        for index, record in enumerate(records):
            try:
                validator.validate(record)
            except ValidationError as error:
                print("====================")
                print("Error while validating the following record")
                print(record)
                print(error)
                num_errors += 1
                if args.fail_fast:
                    exit(1)
            if index and not index % 100:
                print(f"Validated {index} records")
    print(f"Found a total of {num_errors} validation errors")


parser = argparse.ArgumentParser(
    description="Validation de records d'un export d'une collection Kinto"
)
parser.add_argument(
    "records_path", type=str, help="chemin vers l'export de la collection Kinto"
)
parser.add_argument(
    "--fail-fast",
    action="store_true",
    help="stop at the first validation error",
    default=False,
)
parser.add_argument(
    "--as-list",
    action="store_true",
    help="the list of records isn't 'under' a `data` key in a dict (not a Kinto response)",
    default=False,
)

parse(parser.parse_args())
