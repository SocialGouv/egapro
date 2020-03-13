import argparse
import json
import os

import kinto_http


KINTO_SERVER = os.environ.get("KINTO_SERVER", "http://localhost:8888/v1")
KINTO_ADMIN_LOGIN = os.environ.get("KINTO_ADMIN_LOGIN", "admin")
KINTO_ADMIN_PASSWORD = os.environ.get("KINTO_ADMIN_PASSWORD", "passw0rd")
KINTO_BUCKET = os.environ.get("KINTO_BUCKET", "egapro")
KINTO_COLLECTION = os.environ.get("KINTO_COLLECTION", "indicators_datas")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export des données Egapro.")
    parser.add_argument(
        "dump_file_path", type=str, help="chemin vers le fichier d'export"
    )
    parser.add_argument(
        "-a",
        "--all",
        help="extraire la totalité des records, pas uniquement les déclarations validées",
        action="store_true",
        default=False,
    )
    args = parser.parse_args()

    client = kinto_http.Client(
        server_url=KINTO_SERVER, auth=(KINTO_ADMIN_LOGIN, KINTO_ADMIN_PASSWORD)
    )
    try:
        info = client.server_info()
    except ConnectionError as err:
        raise KintoImporterError(
            f"Connection au serveur Kinto impossible: {err}. Vérifiez la documentation pour paramétrer l'accès."
        )

    filters = {}
    if not args.all:
        filters["data.declaration.formValidated"] = "Valid"
    records = client.get_records(
        bucket=KINTO_BUCKET, collection=KINTO_COLLECTION, **filters
    )
    print("Number of records", len(records))
    with open(args.dump_file_path, "w") as dump_file:
        json.dump(records, dump_file)
