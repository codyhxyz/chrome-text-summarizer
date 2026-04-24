/* ============================================================
 * Options controller.
 * Key management + provider status probe + prompt editor.
 * ============================================================ */

(() => {
    const $ = (id) => document.getElementById(id);

    const dot = $("o-dot");
    const providerLabel = $("o-provider-label");
    const providerSub = $("o-provider-sub");

    const apiKey = $("o-api-key");
    const save = $("o-save");
    const del = $("o-delete");
    const status = $("o-status");

    const prompt = $("o-prompt");
    const promptStatus = $("o-prompt-status");

    const DEFAULT_PROMPT = "Summarize the following text:";
    let saveTimer;

    // ---------- Provider status ----------

    async function refreshStatus() {
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
            providerLabel.textContent = "On-device · Gemini Nano";
            providerSub.textContent = "Installed · runs offline, no network";
        } else if (availability === "downloadable") {
            dot.setAttribute("data-state", "warn");
            providerLabel.textContent = "On-device · downloadable";
            providerSub.textContent =
                "Nano will download on first use (~2GB, one-time).";
        } else if (availability === "downloading") {
            dot.setAttribute("data-state", "streaming");
            providerLabel.textContent = "Downloading Nano model";
            providerSub.textContent = "Check the side panel for progress.";
        } else {
            if (hasKey) {
                dot.setAttribute("data-state", "on");
                providerLabel.textContent = "Cloud · Gemini API";
                providerSub.textContent =
                    "On-device unavailable on this Chrome build. Using cloud fallback.";
            } else {
                dot.setAttribute("data-state", "error");
                providerLabel.textContent = "No provider available";
                providerSub.textContent =
                    "On-device unavailable and no API key configured. Add a key below.";
            }
        }

        apiKey.value = geminiApiKey || "";
    }

    // ---------- Key ----------

    save.addEventListener("click", () => {
        const v = apiKey.value.trim();
        if (!v) {
            status.textContent = "Empty";
            status.style.color = "var(--danger)";
            return;
        }
        chrome.storage.local.set({ geminiApiKey: v }, () => {
            status.textContent = "Saved";
            status.style.color = "var(--ok)";
            setTimeout(() => (status.textContent = ""), 1600);
            refreshStatus();
        });
    });

    del.addEventListener("click", () => {
        chrome.storage.local.remove(["geminiApiKey"], () => {
            apiKey.value = "";
            status.textContent = "Deleted";
            status.style.color = "var(--warn)";
            setTimeout(() => (status.textContent = ""), 1600);
            refreshStatus();
        });
    });

    // ---------- Prompt ----------

    function loadPrompt() {
        chrome.storage.sync.get(["customPrompt"], ({ customPrompt }) => {
            prompt.value = customPrompt || DEFAULT_PROMPT;
        });
    }

    prompt.addEventListener("input", () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            const v = prompt.value.trim();
            if (!v) {
                promptStatus.textContent = "";
                return;
            }
            chrome.storage.sync.set({ customPrompt: v }, () => {
                promptStatus.textContent = "Saved";
                promptStatus.style.color = "var(--ok)";
                setTimeout(() => (promptStatus.textContent = ""), 1500);
            });
        }, 300);
    });

    loadPrompt();
    refreshStatus();
})();
