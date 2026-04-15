/**
 * Orchestrator HTTP API (authorized cookies). Maps API responses locally — no fabricated fields.
 */
import { apiUrl } from '../../lib/apiBase.js';

/** @param {Response} res */
async function readErrorMessage(res) {
  try {
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const j = await res.json();
      if (j && typeof j === 'object') {
        if (typeof j.detail === 'string' && j.detail.trim()) return j.detail.trim();
        if (typeof j.title === 'string' && j.title.trim()) return j.title.trim();
      }
    }
    const t = await res.text();
    return t?.trim().slice(0, 800) || `${res.status} ${res.statusText}`;
  } catch {
    return res.statusText || 'Request failed';
  }
}

/** @param {Record<string, unknown>} o @param {string} camel @param {string} pascal */
function pick(o, camel, pascal) {
  if (!o) return undefined;
  if (Object.prototype.hasOwnProperty.call(o, camel)) return o[camel];
  if (Object.prototype.hasOwnProperty.call(o, pascal)) return o[pascal];
  return undefined;
}

/**
 * @param {unknown} json
 */
function mapPrimaryHandoff(json) {
  if (!json || typeof json !== 'object') return { agentName: '', rationale: '' };
  const o = /** @type {Record<string, unknown>} */ (json);
  return {
    agentName: String(pick(o, 'agentName', 'AgentName') ?? ''),
    rationale: String(pick(o, 'rationale', 'Rationale') ?? ''),
  };
}

/**
 * @param {unknown} json
 */
function mapAdditionalAgent(json) {
  if (!json || typeof json !== 'object') return { agentName: '', rationale: '' };
  const o = /** @type {Record<string, unknown>} */ (json);
  return {
    agentName: String(pick(o, 'agentName', 'AgentName') ?? ''),
    rationale: String(pick(o, 'rationale', 'Rationale') ?? ''),
  };
}

/**
 * @param {unknown} json
 */
export function mapOrchestrationRoutingPlan(json) {
  if (!json || typeof json !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (json);
  const ph = pick(o, 'primaryHandoff', 'PrimaryHandoff');
  const add = pick(o, 'additionalAgents', 'AdditionalAgents');
  const seq = pick(o, 'suggestedSequence', 'SuggestedSequence');
  const nor = pick(o, 'notesOrRisks', 'NotesOrRisks');
  return {
    summary: String(pick(o, 'summary', 'Summary') ?? ''),
    primaryHandoff: mapPrimaryHandoff(ph),
    additionalAgents: Array.isArray(add) ? add.map(mapAdditionalAgent) : [],
    suggestedSequence: Array.isArray(seq) ? seq.map((x) => String(x)) : [],
    notesOrRisks: nor != null && nor !== '' ? String(nor) : null,
  };
}

/**
 * @param {unknown} json
 */
export function mapSpecialistHandoffResult(json) {
  if (!json || typeof json !== 'object') {
    return { agentName: '', status: '', attemptCount: 0, resultSummary: '', structuredJson: null };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  const sj = pick(o, 'structuredJson', 'StructuredJson');
  return {
    agentName: String(pick(o, 'agentName', 'AgentName') ?? ''),
    status: String(pick(o, 'status', 'Status') ?? ''),
    attemptCount: Number(pick(o, 'attemptCount', 'AttemptCount') ?? 0),
    resultSummary: String(pick(o, 'resultSummary', 'ResultSummary') ?? ''),
    structuredJson: sj != null && sj !== '' ? String(sj) : null,
  };
}

/**
 * @param {unknown} json
 */
function mapGeneratedLinkedInPreview(json) {
  if (!json || typeof json !== 'object') {
    return {
      contentPlan: { hook: '', message: '', cta: '' },
      caption: '',
      hashtags: [],
      imageUrl: '',
    };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  const rawPlan = pick(o, 'contentPlan', 'ContentPlan');
  const plan = rawPlan && typeof rawPlan === 'object' ? /** @type {Record<string, unknown>} */ (rawPlan) : {};
  const hashtagsRaw = pick(o, 'hashtags', 'Hashtags');
  const tags = Array.isArray(hashtagsRaw)
    ? hashtagsRaw
        .map((x) => String(x ?? '').trim())
        .filter(Boolean)
        .map((x) => (x.startsWith('#') ? x : `#${x}`))
    : [];
  return {
    contentPlan: {
      hook: String(pick(plan, 'hook', 'Hook') ?? ''),
      message: String(pick(plan, 'message', 'Message') ?? ''),
      cta: String(pick(plan, 'cta', 'Cta') ?? ''),
    },
    caption: String(pick(o, 'caption', 'Caption') ?? ''),
    hashtags: tags,
    imageUrl: String(pick(o, 'imageUrl', 'ImageUrl') ?? ''),
  };
}

/**
 * @param {unknown} json
 */
export function mapOrchestrationWorkflowResponse(json) {
  if (!json || typeof json !== 'object') {
    return {
      runId: '',
      correlationId: '',
      routingAttemptsUsed: 0,
      routingPlan: {
        summary: '',
        primaryHandoff: { agentName: '', rationale: '' },
        additionalAgents: [],
        suggestedSequence: [],
        notesOrRisks: null,
      },
      handoffs: [],
      finalOrchestratorResponse: null,
      orchestratorLearningSummaryJson: null,
      generatedLinkedInPreview: {
        contentPlan: { hook: '', message: '', cta: '' },
        caption: '',
        hashtags: [],
        imageUrl: '',
      },
    };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  const rp = pick(o, 'routingPlan', 'RoutingPlan');
  const hf = pick(o, 'handoffs', 'Handoffs');
  const fo = pick(o, 'finalOrchestratorResponse', 'FinalOrchestratorResponse');
  const ol = pick(o, 'orchestratorLearningSummaryJson', 'OrchestratorLearningSummaryJson');
  const gp = pick(o, 'generatedLinkedInPreview', 'GeneratedLinkedInPreview');
  const emptyPlan = {
    summary: '',
    primaryHandoff: { agentName: '', rationale: '' },
    additionalAgents: [],
    suggestedSequence: [],
    notesOrRisks: null,
  };
  return {
    runId: String(pick(o, 'runId', 'RunId') ?? ''),
    correlationId: String(pick(o, 'correlationId', 'CorrelationId') ?? ''),
    routingAttemptsUsed: Number(pick(o, 'routingAttemptsUsed', 'RoutingAttemptsUsed') ?? 0),
    routingPlan: mapOrchestrationRoutingPlan(rp) ?? emptyPlan,
    handoffs: Array.isArray(hf) ? hf.map(mapSpecialistHandoffResult) : [],
    finalOrchestratorResponse: fo != null && fo !== '' ? String(fo) : null,
    orchestratorLearningSummaryJson: ol != null && ol !== '' ? String(ol) : null,
    generatedLinkedInPreview: mapGeneratedLinkedInPreview(gp),
  };
}

/**
 * @param {unknown} json
 */
export function mapOrchestrationRoutingInvocationResponse(json) {
  if (!json || typeof json !== 'object') {
    return {
      plan: {
        summary: '',
        primaryHandoff: { agentName: '', rationale: '' },
        additionalAgents: [],
        suggestedSequence: [],
        notesOrRisks: null,
      },
      attemptsUsed: 0,
    };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  const planRaw = pick(o, 'plan', 'Plan');
  const emptyPlan = {
    summary: '',
    primaryHandoff: { agentName: '', rationale: '' },
    additionalAgents: [],
    suggestedSequence: [],
    notesOrRisks: null,
  };
  return {
    plan: mapOrchestrationRoutingPlan(planRaw) ?? emptyPlan,
    attemptsUsed: Number(pick(o, 'attemptsUsed', 'AttemptsUsed') ?? 0),
  };
}

/**
 * @param {unknown} json
 */
export function mapOrchestrationStepDetail(json) {
  if (!json || typeof json !== 'object') {
    return {
      stepOrder: 0,
      agentName: '',
      specialistAgentRole: null,
      status: '',
      handoffAttemptCount: 0,
      lastHandoffError: null,
      handoffResult: null,
      startedAtUtc: null,
      completedAtUtc: null,
    };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  const sar = pick(o, 'specialistAgentRole', 'SpecialistAgentRole');
  const lhe = pick(o, 'lastHandoffError', 'LastHandoffError');
  const hr = pick(o, 'handoffResult', 'HandoffResult');
  return {
    stepOrder: Number(pick(o, 'stepOrder', 'StepOrder') ?? 0),
    agentName: String(pick(o, 'agentName', 'AgentName') ?? ''),
    specialistAgentRole: sar != null && sar !== '' ? String(sar) : null,
    status: String(pick(o, 'status', 'Status') ?? ''),
    handoffAttemptCount: Number(pick(o, 'handoffAttemptCount', 'HandoffAttemptCount') ?? 0),
    lastHandoffError: lhe != null && lhe !== '' ? String(lhe) : null,
    handoffResult: hr != null && hr !== '' ? String(hr) : null,
    startedAtUtc: pick(o, 'startedAtUtc', 'StartedAtUtc') ?? null,
    completedAtUtc: pick(o, 'completedAtUtc', 'CompletedAtUtc') ?? null,
  };
}

/**
 * @param {unknown} json
 */
export function mapOrchestrationRunDetail(json) {
  if (!json || typeof json !== 'object') {
    return {
      runId: '',
      correlationId: '',
      status: '',
      initiatedByAgentRole: '',
      routingAttemptCount: 0,
      lastRoutingError: null,
      userMessage: '',
      routingPlanJson: '',
      failureReason: null,
      createdAtUtc: null,
      completedAtUtc: null,
      finalOrchestratorResponse: null,
      orchestratorLearningSummaryJson: null,
      steps: [],
    };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  const steps = pick(o, 'steps', 'Steps');
  const lre = pick(o, 'lastRoutingError', 'LastRoutingError');
  const fr = pick(o, 'failureReason', 'FailureReason');
  const fo = pick(o, 'finalOrchestratorResponse', 'FinalOrchestratorResponse');
  const ol = pick(o, 'orchestratorLearningSummaryJson', 'OrchestratorLearningSummaryJson');
  return {
    runId: String(pick(o, 'runId', 'RunId') ?? ''),
    correlationId: String(pick(o, 'correlationId', 'CorrelationId') ?? ''),
    status: String(pick(o, 'status', 'Status') ?? ''),
    initiatedByAgentRole: String(pick(o, 'initiatedByAgentRole', 'InitiatedByAgentRole') ?? ''),
    routingAttemptCount: Number(pick(o, 'routingAttemptCount', 'RoutingAttemptCount') ?? 0),
    lastRoutingError: lre != null && lre !== '' ? String(lre) : null,
    userMessage: String(pick(o, 'userMessage', 'UserMessage') ?? ''),
    routingPlanJson: String(pick(o, 'routingPlanJson', 'RoutingPlanJson') ?? ''),
    failureReason: fr != null && fr !== '' ? String(fr) : null,
    createdAtUtc: pick(o, 'createdAtUtc', 'CreatedAtUtc') ?? null,
    completedAtUtc: pick(o, 'completedAtUtc', 'CompletedAtUtc') ?? null,
    finalOrchestratorResponse: fo != null && fo !== '' ? String(fo) : null,
    orchestratorLearningSummaryJson: ol != null && ol !== '' ? String(ol) : null,
    steps: Array.isArray(steps) ? steps.map(mapOrchestrationStepDetail) : [],
  };
}

/**
 * @param {unknown} json
 */
export function mapUserGeneratedImageAsset(json) {
  if (!json || typeof json !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (json);
  const rid = pick(o, 'orchestrationRunId', 'OrchestrationRunId');
  const cp = pick(o, 'cloudinaryPublicId', 'CloudinaryPublicId');
  return {
    id: String(pick(o, 'id', 'Id') ?? ''),
    contentState: String(pick(o, 'contentState', 'ContentState') ?? ''),
    channel: String(pick(o, 'channel', 'Channel') ?? ''),
    imageUrl: String(pick(o, 'imageUrl', 'ImageUrl') ?? ''),
    cloudinaryPublicId: cp != null && cp !== '' ? String(cp) : null,
    orchestrationRunId: rid != null && rid !== '' ? String(rid) : null,
    createdAtUtc: pick(o, 'createdAtUtc', 'CreatedAtUtc') ?? null,
  };
}

/**
 * @param {string} message
 * @returns {Promise<{ ok: true, data: ReturnType<typeof mapOrchestrationWorkflowResponse> } | { ok: false, error: string }>}
 */
export async function postOrchestratorRoute(message) {
  const trimmed = message?.trim() ?? '';
  if (!trimmed) {
    return { ok: false, error: 'Message is required.' };
  }
  try {
    const res = await fetch(apiUrl('/api/orchestrator/route'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ message: trimmed }),
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    return { ok: true, data: mapOrchestrationWorkflowResponse(json) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {string} message
 * @returns {Promise<{ ok: true, data: ReturnType<typeof mapOrchestrationRoutingInvocationResponse> } | { ok: false, error: string }>}
 */
export async function postOrchestratorPlan(message) {
  const trimmed = message?.trim() ?? '';
  if (!trimmed) {
    return { ok: false, error: 'Message is required.' };
  }
  try {
    const res = await fetch(apiUrl('/api/orchestrator/plan'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ message: trimmed }),
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    return { ok: true, data: mapOrchestrationRoutingInvocationResponse(json) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {string} runId
 * @returns {Promise<{ ok: true, data: ReturnType<typeof mapOrchestrationRunDetail> } | { ok: false, error: string }>}
 */
export async function getOrchestrationRun(runId) {
  const id = runId?.trim() ?? '';
  if (!id) {
    return { ok: false, error: 'Run id is required.' };
  }
  try {
    const res = await fetch(apiUrl(`/api/orchestrator/runs/${encodeURIComponent(id)}`), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) {
      return { ok: false, error: 'Run not found.' };
    }
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    return { ok: true, data: mapOrchestrationRunDetail(json) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {{ state?: string, take?: number }} [options]
 * @returns {Promise<{ ok: true, items: NonNullable<ReturnType<typeof mapUserGeneratedImageAsset>>[] } | { ok: false, error: string }>}
 */
export async function fetchOrchestratorImages(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.state?.trim()) params.set('state', options.state.trim());
    if (options.take != null && Number.isFinite(options.take)) params.set('take', String(Math.min(100, Math.max(1, options.take))));
    const qs = params.toString();
    const path = qs ? `/api/orchestrator/images?${qs}` : '/api/orchestrator/images';
    const res = await fetch(apiUrl(path), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    const arr = Array.isArray(json) ? json : [];
    const items = /** @type {NonNullable<ReturnType<typeof mapUserGeneratedImageAsset>>[]} */ (
      arr.map(mapUserGeneratedImageAsset).filter(Boolean)
    );
    return { ok: true, items };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {string} imageId
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function deleteOrchestratorImage(imageId) {
  const id = imageId?.trim() ?? '';
  if (!id) {
    return { ok: false, error: 'Image id is required.' };
  }
  try {
    const res = await fetch(apiUrl(`/api/orchestrator/images/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 204) {
      return { ok: true };
    }
    if (res.status === 404) {
      return { ok: false, error: 'Image not found.' };
    }
    return { ok: false, error: await readErrorMessage(res) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}
