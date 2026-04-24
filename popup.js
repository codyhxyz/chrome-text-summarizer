/* ============================================================
 * Popup controller.
 * Status probe + custom prompt editor + onboarding/settings entry.
 * No API key form (it's a one-time concern handled in welcome.html
 * and options.html).
 * ============================================================ */

(() => {
    const $ = (id) => document.getElementById(id);

    const dot = $("p-dot");
    const statusLabel = $("p-status-label");
    const detail = $("p-detail");
    const kbd = $("p-kbd");
    const promptInput = $("p-prompt-input");
    const promptStatus = $("p-prompt-status");
    const openWelcome = $("p-open-welcome");
    const openOptions = $("p-open-options");

    const DEFAULT_PROMPT = "Summarize the following text:";
    let saveTimer;

    const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);
    kbd.textContent = isMac ? "⌘⇧S" : "Ctrl+Shift+S";

    // ---------- Status ----------

    async function refresh() {
        const [{ availability }, { geminiApiKey }] = await Promise.all([
            new Promise((r) =>
                chrome.runtime.sendMessage({ action: "nanoAvailability" }, r)
            ),
            new Promise((r) =>
                chrome.storage.local.get(["geminiApiKey"], r)
            ),
        ]);

        const hasKey = !!geminiApiKey;

        if (availability === "available") {
            dot.setAttribute("data-state", "on");
            statusLabel.textContent = "On-device · ready";
            detail.textContent = "Gemini Nano installed · runs offline";
        } else if (availability === "downloadable") {
            if (hasKey) {
                dot.setAttribute("data-state", "on");
                statusLabel.textContent = "Cloud · ready";
                detail.textContent =
                    "Using Gemini API · on-device available to install";
            } else {
                dot.setAttribute("data-state", "warn");
                statusLabel.textContent = "On-device available";
                detail.textContent =
                    "Click Re-run setup to install Nano (~2GB, one-time)";
            }
        } else if (availability === "downloading") {
            dot.setAttribute("data-state", "streaming");
            statusLabel.textContent = "Downloading model";
            detail.textContent = "Check the side panel for progress";
        } else {
            if (hasKey) {
                dot.setAttribute("data-state", "on");
                statusLabel.textContent = "Cloud · ready";
                detail.textContent = "Using Gemini API · key configured";
            } else {
                dot.setAttribute("data-state", "error");
                statusLabel.textContent = "Setup required";
                detail.textContent = "Click Re-run setup to get going";
            }
        }
    }

    // ---------- Prompt ----------

    chrome.storage.sync.get(["customPrompt"], ({ customPrompt }) => {
        promptInput.value = customPrompt || DEFAULT_PROMPT;
    });

    promptInput.addEventListener("input", () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            const v = promptInput.value.trim();
            if (!v) {
                promptStatus.textContent = "";
                return;
            }
            chrome.storage.sync.set({ customPrompt: v }, () => {
                promptStatus.textContent = "Saved";
                setTimeout(() => (promptStatus.textContent = ""), 1500);
            });
        }, 300);
    });

    // ---------- Actions ----------

    openWelcome.addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
    });
    openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());

    refresh();
})();
