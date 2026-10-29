"""Interactive HTML report renderer with clickable citations and modal previews."""

import json
from typing import Dict, Any
from jinja2 import Template
from quant.models import QuantAuditBundle
from debate.schemas import JudgeVerdict, DebateTurn


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forensic Due Diligence Audit: {{ verdict.ticker }} (FY{{ verdict.fiscal_year }})</title>
    <style>
        :root {
            --bg: #0d1117;
            --surface: #161b22;
            --surface-border: #30363d;
            --text-main: #c9d1d9;
            --text-muted: #8b949e;
            --danger: #f85149;
            --warning: #d29922;
            --success: #3fb950;
            --accent: #58a6ff;
            --highlight: #f2cc6040;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            margin: 0;
            padding: 24px;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--surface-border);
            padding-bottom: 20px;
            margin-bottom: 24px;
        }
        h1 { margin: 0; font-size: 26px; }
        .badge {
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .badge-CRITICAL_RED_FLAG { background-color: rgba(248, 81, 73, 0.2); color: var(--danger); border: 1px solid var(--danger); }
        .badge-ELEVATED_RISK { background-color: rgba(210, 153, 34, 0.2); color: var(--warning); border: 1px solid var(--warning); }
        .badge-CLEAN_AUDIT { background-color: rgba(63, 185, 80, 0.2); color: var(--success); border: 1px solid var(--success); }
        
        .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .card {
            background-color: var(--surface);
            border: 1px solid var(--surface-border);
            border-radius: 8px;
            padding: 18px;
        }
        .card h3 { margin-top: 0; font-size: 14px; color: var(--text-muted); text-transform: uppercase; }
        .metric-value { font-size: 28px; font-weight: bold; margin: 8px 0; }
        .metric-desc { font-size: 13px; color: var(--text-muted); }
        .val-danger { color: var(--danger); }
        .val-warning { color: var(--warning); }
        .val-success { color: var(--success); }

        .section-title { font-size: 20px; border-bottom: 1px solid var(--surface-border); padding-bottom: 8px; margin-top: 32px; margin-bottom: 16px; }

        .timeline-item {
            background-color: var(--surface);
            border-left: 4px solid var(--accent);
            border-radius: 0 8px 8px 0;
            padding: 16px;
            margin-bottom: 16px;
        }
        .timeline-item.bear { border-left-color: var(--danger); }
        .timeline-item.bull { border-left-color: var(--success); }
        .speaker-badge { font-weight: bold; font-size: 12px; margin-bottom: 6px; }

        .citation-tag {
            display: inline-block;
            background: #21262d;
            color: var(--accent);
            border: 1px solid var(--surface-border);
            border-radius: 4px;
            padding: 2px 8px;
            font-size: 12px;
            cursor: pointer;
            margin-top: 8px;
            transition: all 0.2s;
        }
        .citation-tag:hover { background: #30363d; border-color: var(--accent); }

        /* Modal Preview */
        .modal {
            display: none;
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.75);
            justify-content: center;
            align-items: center;
            z-index: 999;
        }
        .modal-content {
            background-color: var(--surface);
            border: 1px solid var(--surface-border);
            border-radius: 8px;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            padding: 24px;
            position: relative;
        }
        .modal-close {
            position: absolute;
            top: 14px; right: 18px;
            font-size: 22px;
            cursor: pointer;
            color: var(--text-muted);
        }
        .highlighted-span {
            background-color: var(--highlight);
            color: #ffe066;
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div>
                <h1>Forensic Diligence Audit: {{ verdict.ticker }}</h1>
                <div class="metric-desc">Fiscal Year {{ verdict.fiscal_year }} | Audit ID: {{ verdict.audit_id }}</div>
            </div>
            <div class="badge badge-{{ verdict.composite_verdict }}">{{ verdict.composite_verdict }}</div>
        </header>

        <div class="card" style="margin-bottom: 24px; border-left: 4px solid var(--accent);">
            <h3>Executive Summary</h3>
            <p>{{ verdict.executive_summary }}</p>
        </div>

        <div class="card-grid">
            <div class="card">
                <h3>Beneish M-Score</h3>
                <div class="metric-value {% if quant.beneish.is_manipulator_suspect %}val-danger{% else %}val-success{% endif %}">
                    {{ quant.beneish.m_score }}
                </div>
                <div class="metric-desc">{{ quant.beneish.interpretation }}</div>
            </div>

            <div class="card">
                <h3>Sloan Accrual Ratio</h3>
                <div class="metric-value {% if quant.sloan.is_red_flag %}val-danger{% else %}val-success{% endif %}">
                    {{ (quant.sloan.accrual_ratio * 100) | round(1) }}%
                </div>
                <div class="metric-desc">{{ quant.sloan.percentile_bucket }}</div>
            </div>

            <div class="card">
                <h3>Altman Z-Score</h3>
                <div class="metric-value {% if quant.altman.is_distressed %}val-danger{% else %}val-success{% endif %}">
                    {{ quant.altman.z_score }}
                </div>
                <div class="metric-desc">{{ quant.altman.zone }}</div>
            </div>

            <div class="card">
                <h3>Debt Covenants</h3>
                <div class="metric-value {% if quant.covenants.overall_covenant_status == 'TECHNICAL_DEFAULT' %}val-danger{% elif quant.covenants.overall_covenant_status == 'TIGHT_HEADROOM' %}val-warning{% else %}val-success{% endif %}">
                    {{ quant.covenants.overall_covenant_status }}
                </div>
                <div class="metric-desc">Leverage headroom: {{ quant.covenants.leverage_headroom_turns }} turns</div>
            </div>
        </div>

        <h2 class="section-title">Forensic Committee Debate</h2>
        {% for turn in debate_turns %}
        <div class="timeline-item {{ turn.speaker.lower() }}">
            <div class="speaker-badge">{{ turn.speaker }} AGENT</div>
            <strong>Thesis:</strong> {{ turn.thesis }}
            <p>{{ turn.argument }}</p>
            <div>
                {% for cite in turn.citations %}
                <span class="citation-tag" onclick="openCitation('{{ cite.chunk_id }}', '{{ cite.item }}', {{ cite.char_span[0] }}, {{ cite.char_span[1] }}, `{{ cite.excerpt | escape }}`)">
                    📎 {{ cite.item }} [span: {{ cite.char_span[0] }}-{{ cite.char_span[1] }}]
                </span>
                {% endfor %}
            </div>
        </div>
        {% endfor %}

        <h2 class="section-title">Verified Citations (Allowlist-Enforced)</h2>
        <div class="card">
            {% if verdict.validated_citations %}
            <ul>
                {% for cite in verdict.validated_citations %}
                <li style="margin-bottom: 10px;">
                    <strong>{{ cite.item }}</strong> (<code>{{ cite.chunk_id }}</code>):
                    <em>"{{ cite.excerpt }}"</em>
                    <button class="citation-tag" onclick="openCitation('{{ cite.chunk_id }}', '{{ cite.item }}', {{ cite.char_span[0] }}, {{ cite.char_span[1] }}, `{{ cite.excerpt | escape }}`)">
                        Inspect SEC Chunk
                    </button>
                </li>
                {% endfor %}
            </ul>
            {% else %}
            <div class="metric-desc">No textual citations attached to this filing snapshot.</div>
            {% endif %}
        </div>
    </div>

    <!-- Modal for Clickable Citation Inspections -->
    <div id="citationModal" class="modal" onclick="closeModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()">
            <span class="modal-close" onclick="closeModal()">&times;</span>
            <h3 id="modalTitle">SEC Source Filing Item</h3>
            <div class="metric-desc" id="modalChunkId" style="margin-bottom: 12px;"></div>
            <div id="modalBody" style="background:#0d1117; padding:14px; border-radius:6px; font-family:monospace; font-size:13px; white-space:pre-wrap;"></div>
        </div>
    </div>

    <script>
        function openCitation(chunkId, item, start, end, excerpt) {
            document.getElementById('modalTitle').innerText = item;
            document.getElementById('modalChunkId').innerText = 'Verified Chunk ID: ' + chunkId + ' (Span: ' + start + ' to ' + end + ')';
            
            // Construct visual preview with span highlighted
            const before = '... [Preceding filing context] ... ';
            const after = ' ... [Continuing disclosure] ...';
            const highlighted = '<span class="highlighted-span">' + excerpt + '</span>';
            document.getElementById('modalBody').innerHTML = before + highlighted + after;
            
            document.getElementById('citationModal').style.display = 'flex';
        }
        function closeModal() {
            document.getElementById('citationModal').style.display = 'none';
        }
    </script>
</body>
</html>
"""


def render_html_report(
    quant_bundle: QuantAuditBundle,
    verdict: JudgeVerdict,
    debate_turns: list[DebateTurn],
) -> str:
    """Render standalone interactive HTML report string."""
    template = Template(HTML_TEMPLATE)
    return template.render(
        quant=quant_bundle,
        verdict=verdict,
        debate_turns=debate_turns,
    )
