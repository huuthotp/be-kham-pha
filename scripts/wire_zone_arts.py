from pathlib import Path

REPLACEMENT = """zoneArts: {
    gate: "assets/zone-gate.jpg?v=1"
  },"""

for slug in [
    "bai-choi-trung-bo",
    "vi-giam-nghe-tinh",
    "cong-chieng-tay-nguyen",
    "xoe-thai-tay-bac",
    "don-ca-tai-tu",
]:
    path = Path(f"games/{slug}/content.js")
    text = path.read_text(encoding="utf-8")
    if 'gate: "assets/zone-gate.jpg?v=1"' in text:
        print("skip", slug)
        continue
    if "zoneArts: {}," not in text:
        raise SystemExit(f"missing zoneArts in {slug}")
    path.write_text(text.replace("zoneArts: {},", REPLACEMENT), encoding="utf-8")
    print("wired", slug)
