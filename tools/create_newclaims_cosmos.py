# create_newclaims_cosmos.py
from pymongo import MongoClient, errors
import os
# Fill in your Cosmos Mongo connection string
# ----- Your Cosmos Mongo connection string -----
CONN_STR = os.getenv("MONGO_URI")
DB_NAME   = "ClaimsDB"
COLL_NAME = "NewClaims"

def main():
    client = MongoClient(CONN_STR)
    db = client[DB_NAME]

    if COLL_NAME not in db.list_collection_names():
        try:
            db.create_collection(COLL_NAME)
            print(f"Created {DB_NAME}.{COLL_NAME}")
        except errors.CollectionInvalid:
            pass

    col = db[COLL_NAME]
    col.create_index([("status", 1), ("ClaimStartDt", -1)])
    col.create_index([("Provider", 1), ("status", 1)])
    col.create_index([("ClaimID", 1)])

    print("Indexes on NewClaims:")
    for idx in col.list_indexes():
        print(" -", idx["name"], idx["key"])
    client.close()

if __name__ == "__main__":
    if "<USER>" in CONN_STR:
        raise SystemExit("Edit CONN_STR with your real Cosmos Mongo URI.")
    main()
