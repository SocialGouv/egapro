from naf import DB as NAF


def format_naf_code(code):
    if not code or code == "[NON-DIFFUSIBLE]":
        return code
    label = NAF[code] if code in NAF else "inconnu"
    return f"{code} - {label}"
