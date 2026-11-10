(() => {
    'use strict';

    /* =====================================================================
     * Configuration
     * ===================================================================== */
    const MAP = { x: 41.77, y: 185.88, w: 512.15, h: 443.84 };   // drawable map area (SVG units)
    const MARATHON_KM = 42.195;
    const MAX_ZOOM = 7;                                          // 7x closer than "fit"
    const POLL_MS = 15000;                                       // how often a selected runner is refreshed

    /* ---------------------------------------------------------------------
     * Runner data. Replace `fetchRunner` with a call to your timing API.
     * It must resolve to { bib, name, km, photo? } or null if not found.
     * `km` is the distance covered so far along the course (0 - 42.195).
     * --------------------------------------------------------------------- */
    const DEMO_RUNNERS = {
        '1001': { name: 'Bob',   km: 17.4 },
        '1002': { name: 'Freja', km: 30.2 },
        '1003': { name: 'Mads',  km: 5.8 },
        '1004': { name: 'Ida',   km: 41.1 },
        '1005': { name: 'Jonas', km: 0.4 },
    };
    const DEMO_SPEED_KM_PER_S = 0.012;   // demo only: runners creep forward so you can see live updates

    async function fetchRunner(bib) {
        // return fetch(`/api/runners/${bib}`).then(r => (r.ok ? r.json() : null));
        const r = DEMO_RUNNERS[bib];
        if (!r) return null;
        const elapsed = (performance.now() - demoStart) / 1000;
        return { bib, name: r.name, photo: r.photo, km: Math.min(MARATHON_KM, r.km + elapsed * DEMO_SPEED_KM_PER_S) };
    }
    const demoStart = performance.now();

    /* =====================================================================
     * Elements
     * ===================================================================== */
    const $ = id => document.getElementById(id);
    const app = $('app'), svg = $('map'), route = $('route'), routeDone = $('routeDone');
    const viewerEl = $('viewer'), runnerDot = $('runnerDot'), callout = $('callout');
    const form = $('searchForm'), bibInput = $('bib'), message = $('message'), backBtn = $('back');

    /* =====================================================================
     * Route geometry: distance along the path for every km marker
     * ===================================================================== */
    const total = route.getTotalLength();
    const SVG_NS = 'http://www.w3.org/2000/svg';

    /* The route line is the course, so distance run maps straight onto its length. */
    const lengthAtKm = km => Math.max(0, Math.min(MARATHON_KM, km)) / MARATHON_KM * total;

    /* One numbered pill per kilometre, placed on the route itself. */
    (function drawKmPills() {
        const g = $('kmPills');
        for (let k = 1; k <= 42; k++) {
            const p = route.getPointAtLength(lengthAtKm(k));
            const c = document.createElementNS(SVG_NS, 'circle');
            c.setAttribute('class', 'cls-10'); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 5.09);
            const t = document.createElementNS(SVG_NS, 'text');
            t.setAttribute('class', 'cls-1 km-label'); t.setAttribute('x', p.x); t.setAttribute('y', p.y + 2.1);
            t.setAttribute('text-anchor', 'middle'); t.textContent = k;
            g.append(c, t);
        }
    })();

    /* =====================================================================
     * View (pan & zoom by rewriting the viewBox)
     * ===================================================================== */
    const view = { cx: MAP.x + MAP.w / 2, cy: MAP.y + MAP.h / 2, w: MAP.w };
    let box = app.getBoundingClientRect();

    const aspect = () => box.width / box.height;
    const fitWidth = () => Math.min(MAP.w, MAP.h * aspect());   // widest view that stays inside the map
    const clampView = () => {
        const a = aspect();
        view.w = Math.min(fitWidth(), Math.max(fitWidth() / MAX_ZOOM, view.w));
        const h = view.w / a;
        view.cx = Math.min(MAP.x + MAP.w - view.w / 2, Math.max(MAP.x + view.w / 2, view.cx));
        view.cy = Math.min(MAP.y + MAP.h - h / 2, Math.max(MAP.y + h / 2, view.cy));
    };

    let raf = 0;
    function render() {
        raf = 0;
        clampView();
        const h = view.w / aspect();
        svg.setAttribute('viewBox', `${view.cx - view.w / 2} ${view.cy - h / 2} ${view.w} ${h}`);
        placeOverlays();
    }
    const requestRender = () => { if (!raf) raf = requestAnimationFrame(render); };

    const toScreen = (x, y) => {
        const s = box.width / view.w;                         // px per SVG unit
        return { x: (x - view.cx) * s + box.width / 2, y: (y - view.cy) * s + box.height / 2 };
    };
    const toMap = (px, py) => {
        const s = view.w / box.width;
        return { x: (px - box.width / 2) * s + view.cx, y: (py - box.height / 2) * s + view.cy };
    };

    function zoomAt(factor, px = box.width / 2, py = box.height / 2) {
        const before = toMap(px, py);
        view.w /= factor;
        clampView();
        const after = toMap(px, py);
        view.cx += before.x - after.x;
        view.cy += before.y - after.y;
        requestRender();
    }

    let anim = 0;
    function flyTo(x, y, w, ms = 600) {
        cancelAnimationFrame(anim);
        const from = { ...view }, t0 = performance.now();
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const step = now => {
            const t = reduce ? 1 : Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3);
            view.cx = from.cx + (x - from.cx) * e;
            view.cy = from.cy + (y - from.cy) * e;
            view.w  = from.w  + (w - from.w)  * e;
            render();
            if (t < 1) anim = requestAnimationFrame(step);
        };
        anim = requestAnimationFrame(step);
    }

    /* ---- gestures: drag, pinch, wheel ---- */
    const pointers = new Map();
    let pinch = null;
    svg.addEventListener('pointerdown', e => {
        cancelAnimationFrame(anim);
        svg.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        svg.classList.add('dragging');
        if (pointers.size === 2) pinch = pinchState();
    });
    svg.addEventListener('pointermove', e => {
        const p = pointers.get(e.pointerId);
        if (!p) return;
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        p.x = e.clientX; p.y = e.clientY;
        if (pointers.size === 1) {
            const s = view.w / box.width;
            view.cx -= dx * s; view.cy -= dy * s;
            requestRender();
        } else if (pointers.size === 2 && pinch) {
            const now = pinchState();
            zoomAt(now.dist / pinch.dist, now.x - box.left, now.y - box.top);
            const s = view.w / box.width;
            view.cx -= (now.x - pinch.x) * s; view.cy -= (now.y - pinch.y) * s;
            pinch = now;
            requestRender();
        }
    });
    const endPointer = e => {
        pointers.delete(e.pointerId);
        pinch = pointers.size === 2 ? pinchState() : null;
        if (!pointers.size) svg.classList.remove('dragging');
    };
    svg.addEventListener('pointerup', endPointer);
    svg.addEventListener('pointercancel', endPointer);
    function pinchState() {
        const [a, b] = [...pointers.values()];
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, dist: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
    }
    svg.addEventListener('wheel', e => {
        e.preventDefault();
        zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - box.left, e.clientY - box.top);
    }, { passive: false });

    $('zoomIn').addEventListener('click', () => zoomAt(1.6));
    $('zoomOut').addEventListener('click', () => zoomAt(1 / 1.6));
    $('locate').addEventListener('click', () => {
        if (current) focusRunner(true);
        else if (viewerPos) flyTo(viewerPos.x, viewerPos.y, fitWidth() / 2.5);
        else flyTo(MAP.x + MAP.w / 2, MAP.y + MAP.h / 2, fitWidth());
    });

    /* =====================================================================
     * Overlays: your position, the runner and the callout
     * ===================================================================== */
    let viewerPos = null;     // {x, y, heading} in SVG coordinates
    let current = null;       // {runner, x, y}

    /** Place your own location on the map. heading is degrees clockwise from north-up (0 = up). */
    window.setViewerPosition = (x, y, heading = 0) => {
        viewerPos = { x, y, heading };
        viewerEl.hidden = false;
        requestRender();
    };

    function placeOverlays() {
        if (viewerPos) {
            const p = toScreen(viewerPos.x, viewerPos.y);
            viewerEl.style.transform = `translate(${p.x}px, ${p.y}px)`;
            viewerEl.querySelector('.viewer-cone').style.transform = `rotate(${viewerPos.heading}deg)`;
        }
        if (current) {
            const p = toScreen(current.x, current.y);
            runnerDot.style.transform = `translate(${p.x}px, ${p.y}px)`;
            callout.style.transform = `translate(${p.x - 84}px, ${p.y - 196 - 12}px)`;
        }
    }

    /* =====================================================================
     * Runner lookup
     * ===================================================================== */
    const avatarColours = ['#1d1687', '#fa1683', '#7a3cff', '#0a8f6a', '#e8590c'];
    function setPhoto(runner) {
        const el = $('calloutPhoto');
        if (runner.photo) {
            el.style.backgroundImage = `url("${runner.photo}")`; el.textContent = '';
        } else {
            el.style.backgroundImage = 'none';
            el.style.backgroundColor = avatarColours[[...runner.name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColours.length];
            el.textContent = runner.name.trim().charAt(0).toUpperCase();
        }
    }

    function showMessage(text) {
        message.textContent = text; message.hidden = !text;
    }

    function updateRunner(runner) {
        const len = lengthAtKm(runner.km);
        const p = route.getPointAtLength(len);
        current = { runner, x: p.x, y: p.y };
        routeDone.setAttribute('d', route.getAttribute('d'));
        routeDone.style.strokeDasharray = `${len} ${total}`;
        $('calloutName').textContent = runner.name;
        $('calloutStat').textContent = `${runner.km.toFixed(1)} km of 42.2`;
        setPhoto(runner);
        runnerDot.hidden = callout.hidden = backBtn.hidden = false;
        placeOverlays();
    }

    function focusRunner(animate) {
        if (!current) return;
        const w = fitWidth() / 1.9;
        const h = w / aspect();
        // keep the runner a little below the middle so the callout above it fits on screen
        flyTo(current.x, current.y - h * 0.12, w, animate ? 650 : 0);
    }

    let pollTimer = 0;
    async function lookup(bib) {
        clearInterval(pollTimer);
        showMessage('');
        let runner = null;
        try { runner = await fetchRunner(bib); }
        catch { showMessage('Could not reach the tracker. Try again in a moment.'); return; }
        if (!runner) { showMessage(`No runner found with bib ${bib}. Check the number and try again.`); return; }
        updateRunner(runner);
        focusRunner(true);
        pollTimer = setInterval(async () => {
            try { const r = await fetchRunner(bib); if (r) updateRunner(r); } catch { /* keep last position */ }
        }, POLL_MS);
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        const bib = bibInput.value.replace(/\D/g, '');
        if (!bib) { showMessage('Enter a bib number to find a runner.'); bibInput.focus(); return; }
        bibInput.blur();
        lookup(bib);
    });

    backBtn.addEventListener('click', () => {
        clearInterval(pollTimer);
        current = null;
        runnerDot.hidden = callout.hidden = backBtn.hidden = true;
        routeDone.style.strokeDasharray = '0 99999';
        bibInput.value = ''; showMessage('');
        flyTo(MAP.x + MAP.w / 2, MAP.y + MAP.h / 2, fitWidth());
    });

    new ResizeObserver(() => { box = app.getBoundingClientRect(); requestRender(); }).observe(app);

    /* =====================================================================
     * Start
     * ===================================================================== */
    routeDone.style.strokeDasharray = '0 99999';
    // Demo "you are here" position. Swap for a real GPS-to-map conversion.
    window.setViewerPosition(167, 470, 12);
    render();

    // `?bib=1001` in the URL opens straight onto a runner
    const q = new URLSearchParams(location.search).get('bib');
    if (q) { bibInput.value = q; lookup(q.replace(/\D/g, '')); }
})();
