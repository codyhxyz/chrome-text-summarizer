/* ============================================================
 * Welcome page controller.
 * Three-step guided onboarding:
 *  1. Pick a brain — auto-detect Nano; if absent, walk through
 *     getting a Gemini API key (link + paste field).
 *  2. Pin to toolbar (informational).
 *  3. Try it — sample passage + button that runs a real summary.
 * ============================================================ */

(() => {
    const $ = (id) => document.getElementById(id);

    const stepProvider = $("step-provider");
    const providerDetail = $("provider-detail");
    const providerActions = $("provider-actions");
    const samplePassage = $("sample-passage");
    const btnTry = $("btn-try");
    const btnClose = $("btn-close");
    const btnOptions = $("btn-options");
    const allset = $("allset");
    const kbdHint = $("kbd-hint");

    const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);
    kbdHint.textContent = isMac ? "⌘⇧S" : "Ctrl+Shift+S";

    // ---------- Step 1: provider check ----------

    let providerComplete = false;

    function markProviderDone(label, detail) {
        providerComplete = true;
        stepProvider.classList.remove("checking");
        stepProvider.classList.add("complete");
        providerDetail.innerHTML = "";
        const strong = document.createElement("strong");
        strong.textContent = label;
        const p = document.createElement("span");
        p.style.display = "block";
        p.style.marginTop = "2px";
        p.textContent = detail;
        providerDetail.appendChild(strong);
        providerDetail.appendChild(p);
        providerActions.innerHTML = "";
        maybeShowAllSet();
    }

    function renderApiKeyForm(intro) {
        providerActions.innerHTML = "";

        const box = document.createElement("div");
        box.className = "w-providerbox";
        box.innerHTML = `
            <h4>Use the cloud — Gemini API</h4>
            <p>${intro}</p>
            <ol>
                <li>Open <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a> and sign in.</li>
                <li>Click <strong>Create API key</strong> (free tier is plenty).</li>
                <li>Copy the key and paste it below.</li>
            </ol>
            <input type="password" id="w-key" placeholder="AIza…" autocomplete="off" />
            <div style="display:flex; align-items:center; gap:10px;">
                <button class="primary" id="w-save-key">Save key</button>
                <span class="w-providerbox-status" id="w-key-status"></span>
            </div>
        `;
        providerActions.appendChild(box);

        $("w-save-key").addEventListener("click", () => {
            const v = $("w-key").value.trim();
            const status = $("w-key-status");
            if (!v) {
                status.textContent = "Please paste a key.";
                status.style.color = "var(--danger)";
                return;
            }
            chrome.storage.local.set({ geminiApiKey: v }, () => {
                status.textContent = "Saved";
                status.style.color = "var(--ok)";
                setTimeout(() => {
                    markProviderDone(
                        "Cloud — Gemini API",
                        "Key saved. We'll use Gemini for every summary."
                    );
                }, 600);
            });
        });

        // Pre-fill if user already has a key
        chrome.storage.local.get(["geminiApiKey"], ({ geminiApiKey }) => {
            if (geminiApiKey) $("w-key").value = geminiApiKey;
        });
    }

    function renderDownloadable() {
        providerActions.innerHTML = "";

        const box = document.createElement("div");
        box.className = "w-providerbox";
        box.innerHTML = `
            <h4>Install Gemini Nano (recommended)</h4>
            <p>
                A one-time ~2GB download. After that, every summary runs
                on your device — fast, free, fully private.
            </p>
            <div style="display:flex; align-items:center; gap:10px;">
                <button class="primary" id="w-trigger-nano">Trigger download</button>
                <span class="w-providerbox-status" id="w-nano-status"></span>
            </div>
            <p style="margin-top:12px; font-size:11.5px;">
                Prefer the cloud? You can skip Nano and add a Gemini API
                key instead.
            </p>
            <button class="ghost" id="w-use-cloud" style="margin-top:6px;">
                Use cloud Gemini instead
            </button>
        `;
        providerActions.appendChild(box);

        $("w-trigger-nano").addEventListener("click", async () => {
            const status = $("w-nano-status");
            status.textContent = "Asking Chrome to download…";
            status.style.color = "var(--fg-muted)";
            try {
                // Touching Summarizer.create() triggers the download per
                // Chrome's Summarizer API spec.
                const summ = await self.Summarizer.create({
                    type: "tldr",
                    length: "short",
                    format: "plain-text",
                    monitor(m) {
                        m.addEventListener("downloadprogress", (e) => {
                            const pct = Math.round(e.loaded * 100);
                            status.textContent = `Downloading · ${pct}%`;
                        });
                    },
                });
                status.textContent = "Downloaded";
                status.style.color = "var(--ok)";
                summ.destroy?.();
                setTimeout(() => {
                    markProviderDone(
                        "On-device — Gemini Nano",
                        "Installed and ready. Summaries run locally — nothing leaves your machine."
                    );
                }, 700);
            } catch (err) {
                status.textContent = `Failed: ${err.message || err}`;
                status.style.color = "var(--danger)";
                console.error("[welcome] Nano download failed:", err);
            }
        });

        $("w-use-cloud").addEventListener("click", () => {
            renderApiKeyForm(
                "We'll send your selections to Google's Gemini API using your own key."
            );
        });
    }

    async function checkProvider() {
        stepProvider.classList.add("checking");
        providerDetail.textContent = "Checking your browser…";

        // Ask background — service worker can probe Summarizer in any Chrome.
        let availability = "unavailable";
        try {
            const res = await new Promise((r) =>
                chrome.runtime.sendMessage({ action: "nanoAvailability" }, r)
            );
            availability = res?.availability || "unavailable";
        } catch (err) {
            console.warn("[welcome] availability probe failed:", err);
        }

        const { geminiApiKey } = await new Promise((r) =>
            chrome.storage.local.get(["geminiApiKey"], r)
        );

        stepProvider.classList.remove("checking");

        if (availability === "available") {
            markProviderDone(
                "On-device — Gemini Nano",
                "Already installed. Every summary runs locally — nothing leaves your machine."
            );
            return;
        }

        if (geminiApiKey) {
            // User already has a cloud key.
            markProviderDone(
                "Cloud — Gemini API",
                "API key already configured. We'll use Gemini for summaries."
            );
            return;
        }

        if (availability === "downloadable" || availability === "downloading") {
            providerDetail.textContent =
                "Your Chrome supports on-device AI. Install it for a one-time download (recommended), or use the cloud.";
            renderDownloadable();
            return;
        }

        // Unavailable + no key — must guide to cloud.
        providerDetail.textContent =
            "On-device AI isn't available in this browser. Add a Gemini API key (free tier is fine) and we'll use the cloud.";
        renderApiKeyForm(
            "We'll send your selections to Google's Gemini API using your own key."
        );
    }

    // ---------- Step 3: try it ----------

    let trySent = false;

    btnTry.addEventListener("click", () => {
        const text = samplePassage.textContent.trim();
        // Open side panel + run summary.
        chrome.runtime.sendMessage({
            action: "summarize",
            text,
            length: "medium",
            sessionId: `welcome-${Date.now()}`,
        });
        trySent = true;
        btnTry.textContent = "Sent — open the side panel";
        btnTry.disabled = true;
        // Try to open side panel proactively.
        chrome.windows.getCurrent((w) => {
            chrome.sidePanel
                .open({ windowId: w.id })
                .catch((e) =>
                    console.warn(
                        "[welcome] sidePanel.open failed (can't open from welcome tab in some Chromes):",
                        e
                    )
                );
        });
        document.getElementById("step-try").classList.add("complete");
        maybeShowAllSet();
    });

    // ---------- All-set ----------

    function maybeShowAllSet() {
        if (providerComplete) {
            allset.classList.remove("hidden");
        }
    }

    btnClose.addEventListener("click", () => window.close());
    btnOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());

    // ---------- Boot ----------

    checkProvider();
})();
