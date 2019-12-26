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
    validator.validate({"data": "foobar"}, schema)
except ValidationError as error:
    print("validation is validating :P")
    validation_ok = True

if not validation_ok:
    print("validation isn't validating anything, exiting")
    exit(1)


def parse(args):
    with open(args.records_path) as records_file:
        records = json.load(records_file)["data"]

        print(f"Validating {len(records)} records")

        for index, record in enumerate(records):
            try:
                validator.validate(record, schema)
            except ValidationError as error:
                print("Error while validating the following record")
                print(record)
                print(error)
            if index and not index % 100:
                print(f"Validated {index} records")


parser = argparse.ArgumentParser(
    description="Validation de records d'un export d'une collection Kinto"
)
parser.add_argument(
    "records_path", type=str, help="chemin vers l'export de la collection Kinto"
)

parse(parser.parse_args())
