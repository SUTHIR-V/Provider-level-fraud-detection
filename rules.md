# Cline Rules

- Always prioritize making direct file edits (edit_file or write_file).
- If a diff fails once, immediately retry by overwriting the entire file with write_file.
- Do not print long explanations, just apply changes unless the user explicitly asks.
- Never summarize the conversation unless user asks. Focus only on code and file edits.
- When editing files, confirm by quoting only the affected lines, not the entire file.
- Avoid retries that waste tokens; prefer precise, minimal edits.
