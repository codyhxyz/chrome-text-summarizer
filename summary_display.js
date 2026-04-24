/* ============================================================
 * Summary display (fallback tab).
 * Reads handoff from chrome.storage.session, kicks off summarize,
 * then delegates rendering to the shared SummaryUI mount.
 * ============================================================ */

(() => {
    const $ = (id) => document.getElementById(id);

    const view = window.SummaryUI.mountSummaryView({
        statusDot: $("status-dot"),
        statusLabel: $("status-label"),
        providerLabel: $("provider-label"),
        summaryContent: $("summary-content"),
        originalText: $("original-text"),
        errorCard: $("error-card"),
        errorMessage: $("error-message"),
        errorActions: $("error-actions"),
        lengthButtons: document.querySelectorAll(".seg button[data-length]"),
        btnCopy: $("btn-copy"),
        btnStop: $("btn-stop"),
    });

    // Regenerate button on this surface (extra control not in sidepanel footer)
    $("btn-regenerate").addEventListener("click", () => view.regenerate());

    // ---------- Handoff ----------

    const params = new URLSearchParams(window.location.search);
    const handoffId = params.get("handoff");

    async function consumeHandoff(sessionId) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { action: "getHandoff", sessionId },
                (res) => resolve(res?.payload || null)
            );
        });
    }

    async function boot() {
        if (!handoffId) {
            // Opened directly — nothing to do; empty state handles itself.
            return;
        }
        const payload = await consumeHandoff(handoffId);
        if (!payload?.text) {
            // Handoff expired (e.g. page reload). Show an error state.
            chrome.storage.local.set({
                sessionId: handoffId,
                status: "error",
                errorKind: "content",
                errorMessage:
                    "The original selection expired. Go back and re-select the text, then summarize again.",
                selectedText: "",
                summaryText: "",
            });
            return;
        }

        chrome.runtime.sendMessage({
            action: "summarize",
            text: payload.text,
            length: payload.length || "medium",
            sessionId: payload.sessionId || handoffId,
        });
    }

    boot();
})();
