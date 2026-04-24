/* ============================================================
 * Side panel controller.
 * Thin wrapper over ui.js; wires sidepanel-specific pieces:
 * empty-pane toggle, custom prompt editor, platform shortcut hint.
 * ============================================================ */

(() => {
    const $ = (id) => document.getElementById(id);

    const paneEmpty = $("pane-empty");
    const paneActive = $("pane-active");

    const promptInput = $("prompt-input");
    const promptHint = $("prompt-hint");
    const kbdHint = $("kbd-hint");

    const DEFAULT_PROMPT = "Summarize the following text:";
    let saveTimer;

    const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);
    kbdHint.textContent = isMac ? "⌘⇧S" : "Ctrl+Shift+S";

    window.SummaryUI.mountSummaryView({
        statusDot: $("status-dot"),
        statusLabel: $("status-label"),
        providerLabel: $("provider-label"),
        downloadPill: $("download-pill"),
        summaryContent: $("summary-content"),
        originalText: $("original-text"),
        errorCard: $("error-card"),
        errorMessage: $("error-message"),
        errorActions: $("error-actions"),
        lengthButtons: document.querySelectorAll(".seg button[data-length]"),
        btnCopy: $("btn-copy"),
        btnStop: $("btn-stop"),
        onEmpty: (isEmpty) => {
            paneEmpty.classList.toggle("hidden", !isEmpty);
            paneActive.classList.toggle("hidden", isEmpty);
        },
    });

    // ---------- Custom prompt ----------

    chrome.storage.sync.get(["customPrompt"], ({ customPrompt }) => {
        promptInput.value = customPrompt || DEFAULT_PROMPT;
    });

    promptInput.addEventListener("input", () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            const v = promptInput.value.trim();
            if (!v) {
                promptHint.textContent = "";
                return;
            }
            chrome.storage.sync.set({ customPrompt: v }, () => {
                promptHint.textContent = "Saved";
                setTimeout(() => (promptHint.textContent = ""), 1500);
            });
        }, 300);
    });
})();
