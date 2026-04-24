/* ============================================================
 * AI Text Summarizer — service worker.
 * Default: on-device Gemini Nano (Summarizer API, Chrome 138+).
 * Fallback: cloud Gemini 1.5 Pro via BYOK.
 * Streaming both paths. AbortController cancel. Length control.
 * State lives in chrome.storage.local; all UIs subscribe.
 * ============================================================ */

const GEMINI_STREAM_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:streamGenerateContent";

const DEFAULT_PROMPT = "Summarize the following text:";
const DEFAULT_LENGTH = "medium"; // short | medium | long

// Map our length tokens to Gemini maxOutputTokens and to prompt hints.
const LENGTH_CONFIG = {
    short: { maxTokens: 120, hint: "in 1–2 sentences" },
    medium: { maxTokens: 320, hint: "in a short paragraph" },
    long: { maxTokens: 700, hint: "in a detailed paragraph or bulleted list" },
};

// In-memory: the currently-running AbortController, keyed by sessionId.
let activeController = null;
let activeSessionId = null;

// ---------- Storage helpers ----------

function getLocal(keys) {
    return new Promise((r) => chrome.storage.local.get(keys, r));
}
function setLocal(obj) {
    return new Promise((r) => chrome.storage.local.set(obj, r));
}
function getSync(keys) {
    return new Promise((r) => chrome.storage.sync.get(keys, r));
}

async function getApiKey() {
    const { geminiApiKey } = await getLocal(["geminiApiKey"]);
    return geminiApiKey || null;
}

async function getCustomPrompt() {
    const { customPrompt } = await getSync(["customPrompt"]);
    return customPrompt || DEFAULT_PROMPT;
}

async function getLength() {
    const { length } = await getLocal(["length"]);
    return length && LENGTH_CONFIG[length] ? length : DEFAULT_LENGTH;
}

// ---------- State writer ----------

async function writeState(patch) {
    const prev = await getLocal([
        "selectedText",
        "summaryText",
        "status",
        "errorKind",
        "errorMessage",
        "provider",
        "length",
        "sessionId",
    ]);
    await setLocal({ ...prev, ...patch });
}

// ---------- Nano (Summarizer API) ----------

function hasSummarizerApi() {
    // Chrome 138+ exposes the global `Summarizer` in extension pages and
    // service workers. Older Chrome exposes under `ai.summarizer` (origin
    // trial); we only check the stable global to keep the YAGNI line.
    return typeof self !== "undefined" && typeof self.Summarizer !== "undefined";
}

async function nanoAvailability() {
    if (!hasSummarizerApi()) return "unavailable";
    try {
        return await self.Summarizer.availability();
    } catch (err) {
        console.warn("[nano] availability() threw:", err);
        return "unavailable";
    }
}

async function runNano({ text, length, signal, onChunk }) {
    // Summarizer API supports type/length/format directly — no custom prompt.
    const summarizer = await self.Summarizer.create({
        type: "tldr",
        length, // "short" | "medium" | "long"
        format: "markdown",
        monitor(m) {
            m.addEventListener("downloadprogress", (e) => {
                // e.loaded is 0..1 per spec.
                writeState({
                    downloadProgress: Math.round(e.loaded * 100),
                });
            });
        },
    });

    try {
        const stream = summarizer.summarizeStreaming(text, { signal });
        let acc = "";
        for await (const chunk of stream) {
            acc += chunk;
            onChunk(acc);
        }
        return acc;
    } finally {
        try {
            summarizer.destroy?.();
        } catch {}
    }
}

// ---------- Gemini cloud (streaming SSE) ----------

async function runGemini({ text, length, signal, onChunk }) {
    const apiKey = await getApiKey();
    if (!apiKey) {
        const err = new Error("No Gemini API key configured.");
        err.kind = "no-key";
        throw err;
    }

    const prompt = await getCustomPrompt();
    const cfg = LENGTH_CONFIG[length];
    const body = {
        contents: [
            {
                parts: [{ text: `${prompt} ${cfg.hint}\n\n${text}` }],
            },
        ],
        generationConfig: {
            temperature: 0.4,
            maxOutputTokens: cfg.maxTokens,
        },
    };

    const url = `${GEMINI_STREAM_URL}?alt=sse&key=${encodeURIComponent(apiKey)}`;
    let res;
    try {
        res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal,
        });
    } catch (netErr) {
        if (netErr.name === "AbortError") throw netErr;
        const err = new Error(`Network error: ${netErr.message}`);
        err.kind = "network";
        throw err;
    }

    if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        const err = new Error(
            `Gemini API ${res.status}: ${res.statusText}${
                errorBody ? ` — ${errorBody.slice(0, 200)}` : ""
            }`
        );
        err.kind = res.status === 401 || res.status === 403 ? "no-key" : "network";
        throw err;
    }

    // Parse SSE stream.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let acc = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // SSE events separated by blank line; each line "data: {...}"
        let sepIdx;
        while ((sepIdx = buf.indexOf("\n\n")) !== -1) {
            const event = buf.slice(0, sepIdx);
            buf = buf.slice(sepIdx + 2);
            const dataLine = event
                .split("\n")
                .find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            const json = dataLine.slice(5).trim();
            if (!json) continue;
            try {
                const payload = JSON.parse(json);
                const piece =
                    payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (piece) {
                    acc += piece;
                    onChunk(acc);
                }
            } catch (e) {
                console.warn("[gemini] bad SSE chunk:", json.slice(0, 100));
            }
        }
    }
    return acc;
}

// ---------- Orchestration ----------

async function summarize({ text, length, sessionId }) {
    if (!text || text.trim().length < 10) {
        await writeState({
            sessionId,
            status: "error",
            errorKind: "content",
            errorMessage: "Text is too short to summarize (min 10 chars).",
            summaryText: "",
        });
        return;
    }

    // Cancel any in-flight request.
    if (activeController) {
        try {
            activeController.abort();
        } catch {}
    }
    activeController = new AbortController();
    activeSessionId = sessionId;
    const signal = activeController.signal;

    const nanoState = await nanoAvailability();
    const useNano = nanoState === "available" || nanoState === "downloadable";
    const provider = useNano ? "nano" : "gemini";

    await writeState({
        sessionId,
        selectedText: text,
        summaryText: "",
        status: "streaming",
        errorKind: null,
        errorMessage: "",
        provider,
        length,
        downloadProgress: nanoState === "downloadable" ? 0 : null,
    });

    const onChunk = async (acc) => {
        // Only flush if this request is still the active one.
        if (activeSessionId !== sessionId) return;
        await writeState({ summaryText: acc });
    };

    try {
        if (useNano) {
            await runNano({ text, length, signal, onChunk });
        } else {
            await runGemini({ text, length, signal, onChunk });
        }

        if (activeSessionId === sessionId) {
            await writeState({ status: "done", downloadProgress: null });
        }
    } catch (err) {
        if (err.name === "AbortError") {
            await writeState({ status: "aborted" });
            return;
        }
        console.error("[summarize] failed:", err);

        // Nano failure → fall back to Gemini once.
        if (useNano && err.kind !== "no-key") {
            console.warn("[summarize] nano failed, falling back to Gemini");
            try {
                await writeState({ provider: "gemini", summaryText: "" });
                await runGemini({ text, length, signal, onChunk });
                if (activeSessionId === sessionId) {
                    await writeState({ status: "done" });
                }
                return;
            } catch (err2) {
                if (err2.name === "AbortError") {
                    await writeState({ status: "aborted" });
                    return;
                }
                err = err2;
            }
        }

        await writeState({
            status: "error",
            errorKind: err.kind || "unavailable",
            errorMessage: err.message || String(err),
        });
    } finally {
        if (activeSessionId === sessionId) {
            activeController = null;
            activeSessionId = null;
        }
    }
}

function makeSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Context menu ----------

chrome.runtime.onInstalled.addListener((details) => {
    chrome.contextMenus.remove("summarizeSelection", () => {
        void chrome.runtime.lastError; // swallow "not found"
        chrome.contextMenus.create({
            id: "summarizeSelection",
            title: "Summarize selection",
            contexts: ["selection"],
        });
    });

    // First-install onboarding.
    if (details.reason === "install") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("welcome.html"),
        });
    }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "summarizeSelection" || !info.selectionText) return;
    await triggerSummarize(info.selectionText, tab);
});

// ---------- Keyboard shortcut ----------

chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "summarize-selection") return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    // Grab selection from the active tab via scripting.executeScript.
    let selection = "";
    try {
        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection()?.toString() || "",
        });
        selection = result?.result || "";
    } catch (err) {
        console.warn("[shortcut] could not read selection:", err);
    }

    if (!selection.trim()) {
        // Open the side panel with a helpful empty state.
        await openSidePanelFor(tab);
        await writeState({
            sessionId: makeSessionId(),
            status: "error",
            errorKind: "content",
            errorMessage: "Select some text on the page first, then try again.",
            selectedText: "",
            summaryText: "",
        });
        return;
    }

    await triggerSummarize(selection, tab);
});

// ---------- Shared trigger ----------

async function openSidePanelFor(tab) {
    let cfg = null;
    if (tab?.id && tab.id !== -1) cfg = { tabId: tab.id };
    else if (tab?.windowId) cfg = { windowId: tab.windowId };
    if (!cfg) return false;
    try {
        await chrome.sidePanel.open(cfg);
        return true;
    } catch (err) {
        return false;
    }
}

async function triggerSummarize(text, tab) {
    const sessionId = makeSessionId();
    const length = await getLength();

    const opened = await openSidePanelFor(tab);

    if (opened) {
        // Kick off — state updates stream to sidepanel.
        summarize({ text, length, sessionId });
        return;
    }

    // Fallback: open summary_display in new tab (PDF / restricted pages).
    // Hand text off via chrome.storage.session — no URL param size cap.
    const handoffKey = `handoff:${sessionId}`;
    try {
        await chrome.storage.session.set({
            [handoffKey]: { text, length, sessionId },
        });
    } catch (e) {
        // storage.session requires MV3 + Chrome 102+; should be safe.
        console.warn("storage.session unavailable:", e);
    }
    const url = new URL(chrome.runtime.getURL("summary_display.html"));
    url.searchParams.set("handoff", sessionId);
    chrome.tabs.create({ url: url.toString() });
}

// ---------- Message handlers (from UIs) ----------

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "summarize" && req.text) {
        const sessionId = req.sessionId || makeSessionId();
        const length = req.length || DEFAULT_LENGTH;
        summarize({ text: req.text, length, sessionId }).then(() =>
            sendResponse({ ok: true, sessionId })
        );
        return true;
    }

    if (req.action === "cancel") {
        if (activeController) {
            activeController.abort();
            activeController = null;
            activeSessionId = null;
        }
        sendResponse({ ok: true });
        return false;
    }

    if (req.action === "regenerate" && req.length) {
        getLocal(["selectedText"]).then(({ selectedText }) => {
            if (!selectedText) {
                sendResponse({ ok: false, error: "no-text" });
                return;
            }
            setLocal({ length: req.length });
            summarize({
                text: selectedText,
                length: req.length,
                sessionId: makeSessionId(),
            });
            sendResponse({ ok: true });
        });
        return true;
    }

    if (req.action === "getHandoff" && req.sessionId) {
        chrome.storage.session
            .get(`handoff:${req.sessionId}`)
            .then((data) => {
                const payload = data[`handoff:${req.sessionId}`];
                sendResponse({ ok: true, payload });
                // Clear after handoff.
                chrome.storage.session.remove(`handoff:${req.sessionId}`);
            });
        return true;
    }

    if (req.action === "nanoAvailability") {
        nanoAvailability().then((a) => sendResponse({ availability: a }));
        return true;
    }

    return false;
});
