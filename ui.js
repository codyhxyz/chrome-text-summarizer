/* ============================================================
 * Shared UI logic for sidepanel + summary_display.
 * Exports onto window.SummaryUI:
 *   - renderMarkdown(src) → html string
 *   - mountSummaryView(refs) → subscribes to chrome.storage.local
 *     state and renders into the given element refs. Returns a
 *     teardown function.
 * ============================================================ */

(() => {
    // ---------- Markdown (safe, allowlist) ----------

    function escapeHtml(s) {
        return s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function applyInline(s) {
        return s
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/(^|\s)\*([^*]+)\*/g, "$1<em>$2</em>");
    }

    function renderMarkdown(src) {
        if (!src) return "";
        const escaped = escapeHtml(src);
        const lines = escaped.split("\n");
        const out = [];
        let listType = null;
        let para = [];

        const flushPara = () => {
            if (para.length) {
                out.push(`<p>${applyInline(para.join(" "))}</p>`);
                para = [];
            }
        };
        const closeList = () => {
            if (listType) {
                out.push(`</${listType}>`);
                listType = null;
            }
        };

        for (const raw of lines) {
            const line = raw.trim();
            if (!line) {
                flushPara();
                closeList();
                continue;
            }

            const h = line.match(/^(#{1,3})\s+(.*)$/);
            if (h) {
                flushPara();
                closeList();
                out.push(`<h${h[1].length}>${applyInline(h[2])}</h${h[1].length}>`);
                continue;
            }

            const bullet = line.match(/^[-*+]\s+(.*)$/);
            if (bullet) {
                flushPara();
                if (listType !== "ul") {
                    closeList();
                    out.push("<ul>");
                    listType = "ul";
                }
                out.push(`<li>${applyInline(bullet[1])}</li>`);
                continue;
            }

            const num = line.match(/^\d+\.\s+(.*)$/);
            if (num) {
                flushPara();
                if (listType !== "ol") {
                    closeList();
                    out.push("<ol>");
                    listType = "ol";
                }
                out.push(`<li>${applyInline(num[1])}</li>`);
                continue;
            }

            if (line.startsWith("&gt; ")) {
                flushPara();
                closeList();
                out.push(`<blockquote>${applyInline(line.slice(5))}</blockquote>`);
                continue;
            }

            closeList();
            para.push(line);
        }
        flushPara();
        closeList();
        return out.join("");
    }

    // ---------- Summary view ----------

    const PROVIDER_LABEL = {
        nano: "On-device · Nano",
        gemini: "Cloud · Gemini",
    };

    const ERROR_COPY = {
        "no-key":
            "Gemini Nano isn't available here and no cloud API key is configured. Add one in options, or try a recent Chrome build.",
        "no-host-permission":
            "Cloud Gemini needs your permission to reach generativelanguage.googleapis.com. Grant it from the setup page.",
        network:
            "The Gemini API request failed. Check your connection and try again.",
        unavailable:
            "No summarizer was available for this request. Nano may still be downloading, or the cloud API rejected the call.",
        content:
            "The selected text couldn't be summarized. Try a longer selection.",
    };

    const GEMINI_HOST_ORIGINS = [
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:streamGenerateContent",
    ];

    /**
     * refs: {
     *   statusDot, statusLabel, providerLabel, downloadPill?,
     *   summaryContent, originalText,
     *   errorCard, errorMessage, errorActions,
     *   lengthButtons (NodeList), btnCopy, btnStop,
     *   onEmpty?(bool) — optional hook called with true when there is no state yet,
     * }
     */
    function mountSummaryView(refs) {
        const STATE_KEYS = [
            "selectedText",
            "summaryText",
            "status",
            "errorKind",
            "errorMessage",
            "provider",
            "length",
            "downloadProgress",
        ];

        function setStatus(state, label) {
            if (refs.statusDot) refs.statusDot.setAttribute("data-state", state);
            if (refs.statusLabel) refs.statusLabel.textContent = label;
        }

        function renderError(kind, msg) {
            refs.errorCard.classList.remove("hidden");
            refs.errorMessage.textContent =
                ERROR_COPY[kind] || msg || "Something unexpected happened.";

            refs.errorActions.innerHTML = "";
            if (kind === "no-key") {
                const btn = document.createElement("button");
                btn.className = "primary";
                btn.textContent = "Open options";
                btn.addEventListener("click", () =>
                    chrome.runtime.openOptionsPage()
                );
                refs.errorActions.appendChild(btn);
            } else if (kind === "no-host-permission") {
                // Must call permissions.request from a user gesture —
                // do it synchronously in the click handler.
                const btn = document.createElement("button");
                btn.className = "primary";
                btn.textContent = "Grant permission";
                btn.addEventListener("click", () => {
                    chrome.permissions.request(
                        { origins: GEMINI_HOST_ORIGINS },
                        (granted) => {
                            if (granted) regenerate();
                        }
                    );
                });
                refs.errorActions.appendChild(btn);
            }
            const retry = document.createElement("button");
            retry.className =
                kind === "no-key" || kind === "no-host-permission"
                    ? "ghost"
                    : "primary";
            retry.textContent = "Retry";
            retry.addEventListener("click", regenerate);
            refs.errorActions.appendChild(retry);
        }

        function render(data) {
            const {
                selectedText,
                summaryText,
                status,
                errorKind,
                errorMessage: errMsg,
                provider,
                length,
                downloadProgress,
            } = data;

            const activeLen = length || "medium";
            refs.lengthButtons.forEach((b) => {
                b.setAttribute(
                    "aria-pressed",
                    b.dataset.length === activeLen ? "true" : "false"
                );
            });

            if (!selectedText && !status) {
                refs.onEmpty?.(true);
                setStatus("off", "Ready");
                refs.btnStop.classList.add("hidden");
                refs.btnCopy.disabled = true;
                return;
            }
            refs.onEmpty?.(false);

            if (selectedText && refs.originalText) {
                refs.originalText.textContent = selectedText;
            }

            refs.providerLabel.textContent = provider
                ? PROVIDER_LABEL[provider] || "Summary"
                : "Summary";

            if (refs.downloadPill) {
                if (
                    status === "streaming" &&
                    typeof downloadProgress === "number" &&
                    downloadProgress < 100
                ) {
                    refs.downloadPill.classList.remove("hidden");
                    refs.downloadPill.textContent = `Downloading model · ${downloadProgress}%`;
                } else {
                    refs.downloadPill.classList.add("hidden");
                    refs.downloadPill.textContent = "";
                }
            }

            switch (status) {
                case "streaming":
                    setStatus("streaming", "Summarizing");
                    refs.btnStop.classList.remove("hidden");
                    refs.btnCopy.disabled = !summaryText;
                    refs.summaryContent.innerHTML =
                        renderMarkdown(summaryText) +
                        (summaryText ? '<span class="caret"></span>' : "");
                    refs.errorCard.classList.add("hidden");
                    break;
                case "done":
                    setStatus("on", "Done");
                    refs.btnStop.classList.add("hidden");
                    refs.btnCopy.disabled = !summaryText;
                    refs.summaryContent.innerHTML = renderMarkdown(summaryText);
                    refs.errorCard.classList.add("hidden");
                    break;
                case "aborted":
                    setStatus("warn", "Stopped");
                    refs.btnStop.classList.add("hidden");
                    refs.btnCopy.disabled = !summaryText;
                    refs.summaryContent.innerHTML = renderMarkdown(summaryText);
                    refs.errorCard.classList.add("hidden");
                    break;
                case "error":
                    setStatus("error", "Error");
                    refs.btnStop.classList.add("hidden");
                    refs.btnCopy.disabled = true;
                    refs.summaryContent.innerHTML = "";
                    renderError(errorKind, errMsg);
                    break;
                case "loading":
                default:
                    setStatus("warn", "Queued");
                    refs.btnStop.classList.remove("hidden");
                    refs.btnCopy.disabled = true;
                    refs.errorCard.classList.add("hidden");
                    refs.summaryContent.innerHTML = "";
            }
        }

        // ---------- Actions ----------

        function cancel() {
            chrome.runtime.sendMessage({ action: "cancel" });
        }
        function regenerate() {
            const active = document.querySelector(
                '.seg button[aria-pressed="true"]'
            );
            const length = active?.dataset.length || "medium";
            chrome.runtime.sendMessage({ action: "regenerate", length });
        }
        async function copySummary() {
            const { summaryText } = await chrome.storage.local.get([
                "summaryText",
            ]);
            if (!summaryText) return;
            try {
                await navigator.clipboard.writeText(summaryText);
                const original = refs.btnCopy.textContent;
                refs.btnCopy.textContent = "Copied";
                setTimeout(() => (refs.btnCopy.textContent = original), 1400);
            } catch (err) {
                console.warn("clipboard failed:", err);
            }
        }

        refs.lengthButtons.forEach((b) => {
            b.addEventListener("click", () => {
                const next = b.dataset.length;
                chrome.storage.local.set({ length: next });
                chrome.storage.local.get(["selectedText"], ({ selectedText }) => {
                    if (selectedText) regenerate();
                });
            });
        });

        refs.btnStop.addEventListener("click", cancel);
        refs.btnCopy.addEventListener("click", copySummary);

        // ---------- Subscribe ----------

        chrome.storage.local.get(STATE_KEYS, render);
        const listener = (changes, area) => {
            if (area !== "local") return;
            chrome.storage.local.get(STATE_KEYS, render);
        };
        chrome.storage.onChanged.addListener(listener);

        return {
            regenerate,
            cancel,
            teardown() {
                chrome.storage.onChanged.removeListener(listener);
            },
        };
    }

    window.SummaryUI = { renderMarkdown, mountSummaryView };
})();
