#!/usr/bin/env python3
"""Regenerate Speckit workflows from GitHub Copilot agents into Cursor + Agent Skills layouts.

Requires PyYAML:

    python3 -m venv .venv-migrate && .venv-migrate/bin/pip install -r scripts/requirements-migrate.txt
    .venv-migrate/bin/python scripts/migrate-speckit-github-to-cursor.py

Source of truth: `.github/agents/*.agent.md` (paired prompts under `.github/prompts/` are superseded by
`.cursor/commands/` for Cursor).
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
AGENTS_SRC = ROOT / ".github" / "agents"
OUT_AGENTS = ROOT / ".cursor" / "agents"
OUT_COMMANDS = ROOT / ".cursor" / "commands"
OUT_SKILLS = ROOT / ".agents" / "skills"

FRONTMATTER_KEYS_CORE = frozenset({"description", "handoffs"})


def stem_to_slug(stem: str) -> str:
    return stem.replace(".", "-")


def handoffs_to_markdown(handoffs: list) -> str:
    if not handoffs:
        return ""
    lines = [
        "",
        "## Suggested next steps (Speckit handoffs)",
        "",
        "These were GitHub Copilot agent handoffs. In Cursor, use the slash command `/speckit-...` or invoke the subagent of the same name (e.g. `speckit-plan`).",
        "",
    ]
    for h in handoffs:
        agent = h.get("agent") or ""
        target = agent.replace(".", "-") if agent else ""
        label = h.get("label", "")
        prompt = h.get("prompt", "")
        lines.append(f"- **{label}** → `{target}`: {prompt}")
    lines.append("")
    return "\n".join(lines)


def extras_to_markdown(meta: dict) -> str:
    extras = {k: v for k, v in meta.items() if k not in FRONTMATTER_KEYS_CORE}
    if not extras:
        return ""
    buf = io.StringIO()
    buf.write("## Speckit agent metadata (from `.github/agents`)\n\n")
    buf.write("Additional Copilot agent frontmatter preserved for reference:\n\n")
    for k, v in extras.items():
        buf.write(f"### `{k}`\n\n")
        buf.write("```yaml\n")
        yaml.safe_dump(v, buf, default_flow_style=False, allow_unicode=True)
        buf.write("```\n\n")
    return buf.getvalue()


def yaml_frontmatter(data: dict) -> str:
    buf = io.StringIO()
    yaml.safe_dump(
        data,
        buf,
        default_flow_style=False,
        allow_unicode=True,
        sort_keys=False,
    )
    return "---\n" + buf.getvalue().rstrip("\n") + "\n---\n\n"


def parse_agent(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    stripped = text.lstrip("\n\r \t")
    if not stripped.startswith("---"):
        return {}, text

    _, fm_raw, body = stripped.split("---", 2)
    try:
        meta = yaml.safe_load(fm_raw) or {}
    except yaml.YAMLError as exc:
        msg = f"Invalid YAML frontmatter in {path}: {exc}"
        raise ValueError(msg) from exc
    if not isinstance(meta, dict):
        msg = f"Frontmatter must be a mapping in {path}"
        raise ValueError(msg)
    return meta, body.lstrip("\n")


def infer_description(stem: str, body: str) -> str:
    for line in body.split("\n")[:40]:
        s = line.strip()
        if s.lower().startswith("# command:"):
            return s.lstrip("#").strip()
    rest = stem.split(".", 1)[-1] if "." in stem else stem
    return (
        f"Speckit workflow `{rest.replace('.', ' → ')}` "
        "(migrated from GitHub Copilot agents)."
    )


def command_title(stem: str) -> str:
    if "." not in stem:
        return stem
    _, rest = stem.split(".", 1)
    return f"Speckit: {rest.replace('.', ' → ')}"


def main() -> int:
    files = sorted(AGENTS_SRC.glob("*.agent.md"))
    if not files:
        print("No agents found", file=sys.stderr)
        return 1

    OUT_AGENTS.mkdir(parents=True, exist_ok=True)
    OUT_COMMANDS.mkdir(parents=True, exist_ok=True)
    OUT_SKILLS.mkdir(parents=True, exist_ok=True)

    for path in files:
        stem = path.name[: -len(".agent.md")]
        slug = stem_to_slug(stem)
        meta, body = parse_agent(path)

        desc = meta.get("description") or ""
        if isinstance(desc, str):
            desc = " ".join(desc.split()).strip()
        if not desc:
            desc = infer_description(stem, body)
        if len(desc) > 1024:
            desc = desc[:1021] + "..."

        handoffs = meta.get("handoffs") or []
        if not isinstance(handoffs, list):
            handoffs = []

        prefix = extras_to_markdown(meta)
        suffix = handoffs_to_markdown(handoffs)
        full_body = f"{prefix}{body}{suffix}"

        agent_doc = yaml_frontmatter(
            {"name": slug, "description": desc, "model": "inherit"},
        ) + full_body
        (OUT_AGENTS / f"{slug}.md").write_text(agent_doc, encoding="utf-8")

        skill_doc = yaml_frontmatter({"name": slug, "description": desc}) + full_body
        skill_dir = OUT_SKILLS / slug
        skill_dir.mkdir(parents=True, exist_ok=True)
        (skill_dir / "SKILL.md").write_text(skill_doc, encoding="utf-8")

        title = command_title(stem)
        cmd = f"""# {title}

User input (feature / context):

```text
$ARGUMENTS
```

Execute the **{slug}** workflow using the instructions in `.agents/skills/{slug}/SKILL.md` (portable Agent Skills layout) or `.cursor/agents/{slug}.md` (Cursor subagent). Use the fenced block above as the workflow’s user input / `$ARGUMENTS`.
"""
        (OUT_COMMANDS / f"{slug}.md").write_text(cmd, encoding="utf-8")

    print(f"Wrote {len(files)} workflows to .cursor/agents, .cursor/commands, .agents/skills")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
