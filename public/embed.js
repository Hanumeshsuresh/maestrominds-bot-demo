/**
 * ═══════════════════════════════════════════════════
 * MAESTROMINDS AI ASSISTANT — EMBED SCRIPT
 * ═══════════════════════════════════════════════════
 * Include this script on any website to add the 
 * MAESTROMINDS AI Assistant widget.
 * 
 * Usage: <script src="[YOUR_URL]/embed.js"></script>
 */

(function () {
    // ─── Configuration ──────────────────────────────────────
    const CONFIG = {
        title: "MAESTROMINDS AI Assistant",
        // Automatically determine the absolute path to this server
        baseUrl: window.location.origin || (document.currentScript ? new URL(document.currentScript.src).origin : '')
    };

    // ─── Styles ─────────────────────────────────────────────
    const styles = `
        /* Floating Button */
        #maestro-launcher {
            position: fixed;
            bottom: 25px;
            right: 25px;
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #38beff, #a259ff);
            border-radius: 50%;
            box-shadow: 0 10px 30px rgba(56, 190, 255, 0.4);
            cursor: pointer;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        #maestro-launcher:hover {
            transform: scale(1.1) rotate(5deg);
        }
        #maestro-launcher svg {
            width: 35px;
            height: 35px;
            fill: white;
        }

        /* Chat Window Container */
        #maestro-container {
            position: fixed;
            bottom: 110px;
            right: 25px;
            width: 400px;
            height: 600px;
            max-width: 90vw;
            max-height: 80vh;
            background: rgba(6, 14, 30, 0.95);
            border: 1px solid rgba(56, 190, 255, 0.3);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            z-index: 2147483646;
            overflow: hidden;
            display: none;
            flex-direction: column;
            animation: maestroFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        #maestro-container.open {
            display: flex;
        }

        @keyframes maestroFadeIn {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Iframe */
        #maestro-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        /* Mobile Adjustments */
        @media (max-width: 480px) {
            #maestro-container {
                right: 0;
                bottom: 0;
                width: 100%;
                height: 100%;
                max-width: 100%;
                max-height: 100%;
                border-radius: 0;
            }
            #maestro-launcher {
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
            }
        }
    `;

    // ─── DOM Creation ───────────────────────────────────────
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Create Launcher
    const launcher = document.createElement("div");
    launcher.id = "maestro-launcher";
    launcher.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M20,2H4C2.9,2,2,2.9,2,4v18l4-4h14c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M20,16H5.17L4,17.17V4h16V16z M7,9h10v2H7V9z M7,12h7v2H7V12z"/>
        </svg>
    `;
    document.body.appendChild(launcher);

    // Create Container & Iframe
    const container = document.createElement("div");
    container.id = "maestro-container";

    const iframe = document.createElement("iframe");
    iframe.id = "maestro-iframe";
    iframe.src = CONFIG.baseUrl + "/office-assistant.html";
    iframe.allow = "microphone";

    container.appendChild(iframe);
    document.body.appendChild(container);

    // ─── Logic ──────────────────────────────────────────────
    launcher.onclick = function () {
        container.classList.toggle("open");
        if (container.classList.contains("open")) {
            launcher.style.transform = "scale(0.8) rotate(-45deg)";
            launcher.style.background = "#ff6b6b";
            launcher.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>';
        } else {
            launcher.style.transform = "";
            launcher.style.background = "linear-gradient(135deg, #38beff, #a259ff)";
            launcher.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20,2H4C2.9,2,2,2.9,2,4v18l4-4h14c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M20,16H5.17L4,17.17V4h16V16z M7,9h10v2H7V9z M7,12h7v2H7V12z"/></svg>';
        }
    };
})();
