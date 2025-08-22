import json
import argparse

def json_type(value: str):
    try:
        return json.loads(value)
    except json.JSONDecodeError as e:
        raise argparse.ArgumentTypeError(f"Invalid JSON: {e}")

parser = argparse.ArgumentParser("python_test_json")
parser.add_argument("--body", help="Body of type JSON.", type=json_type, required=True)
args = parser.parse_args()

print(args.body['message'] + ' World !')