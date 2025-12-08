import os
import fasttext
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "app" / "dataset" / "data.txt"
OUTPUT_PATH = BASE_DIR / "app" / "dataset" / "lid.176.ftz"

def train():
    if not DATA_PATH.exists():
        print(f"Error: Not found data file at: {DATA_PATH.absolute()}")
        return

    print(f"Training FastText model from {DATA_PATH}...")

    model = fasttext.train_supervised(
        input=str(DATA_PATH),
        epoch=25,
        lr=0.5,
        wordNgrams=2,
        dim=50,
        minCount=1,
        loss='ova'
    )

    print("Quantizing model (reducing size)...")
    model.quantize(input=str(DATA_PATH), retrain=True)
    model.save_model(str(OUTPUT_PATH))

    if OUTPUT_PATH.exists():
        file_size = os.path.getsize(OUTPUT_PATH) / 1024
        print(f"Success! Model saved to: {OUTPUT_PATH}")
        print(f"Model Size: {file_size:.2f} KB")

    print("\n--- Quick Test Validation ---")

    test_cases = [
        "hôm nay là thứ mấy",
        "trường mình ở đâu vậy ạ",

        "hoc phi ky nay bao nhieu",
        "dang ky tin chi o dau",
        "may tinh cua em bi loi roi",

        "ko vao dc web truong",
        "tk bi khoa roi ad oi",
        "mang lag wa",
        "chieu nay co lich hoc ko",

        "hello admin",
        "what is the tuition fee",
        "where can i find the schedule",
        "system error cannot login",

        "dkm lag qua",
        "fuck you bot",
        "b13t b0 m4y l4 41 Ko?"
    ]

    for text in test_cases:
        labels, probs = model.predict(text, k=1)

        label = labels[0].replace("__label__", "")
        confidence = probs[0] * 100

        # In kết quả căn chỉnh cột
        print(f"'{text:<30}' -> {label.upper()} ({confidence:.2f}%)")

if __name__ == "__main__":
    train()
