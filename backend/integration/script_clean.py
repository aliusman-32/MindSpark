import re

def clean_script_for_display(script: str) -> str:
    """
    Remove SFX, PAUSE (with or without durations), and all asterisk-based formatting (bold/italic) from the script,
    leaving only plain text with natural paragraph breaks.
    """
    # Remove SFX blocks (including any description inside brackets)
    cleaned = re.sub(r'\[SFX:.*?\]', '', script)

    # Remove pause markers: [PAUSE], [PAUSE 1s], **[PAUSE]**, etc.
    # Matches optional asterisks, then [PAUSE, any characters until ], then optional asterisks.
    cleaned = re.sub(r'\*?\*?\[PAUSE[^\]]*\]\*?\*?', '', cleaned)

    # Remove double asterisks (bold markers)
    cleaned = cleaned.replace('**', '')

    # Convert *italic* to italic (remove single asterisks)
    cleaned = re.sub(r'\*(.*?)\*', r'\1', cleaned)

    # Clean extra blank lines (more than two newlines become two)
    cleaned = re.sub(r'\n\s*\n', '\n\n', cleaned).strip()

    return cleaned