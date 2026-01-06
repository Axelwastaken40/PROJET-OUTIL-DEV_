window.addEventListener('load', () => {
    const log = document.createElement('div');
    log.id = 'autotest-log';
    log.style.position = 'fixed';
    log.style.right = '10px';
    log.style.bottom = '10px';
    log.style.maxWidth = '360px';
    log.style.maxHeight = '45vh';
    log.style.overflow = 'auto';
    log.style.background = 'rgba(0,0,0,0.85)';
    log.style.color = '#fff';
    log.style.border = '2px solid #cc0000';
    log.style.padding = '8px';
    log.style.fontFamily = "Courier New, monospace";
    log.style.fontSize = '12px';
    log.style.zIndex = 3000;
    document.body.appendChild(log);

    function append(msg) {
        const p = document.createElement('div');
        p.textContent = msg;
        log.appendChild(p);
        console.log('AUTOTEST:', msg);
    }

    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    (async () => {
        await wait(300);
        append('AUTOTEST START');

        const ids = ['desk-canvas','telephone','dossiers-stack','radio','typewriter','safe','next-day-btn','action-modal','tooltip'];
        append('Checking presence of elements:');
        ids.forEach(id => append(`  ${id}: ${!!document.getElementById(id)}`));

        await wait(400);
        // Tooltip hover test
        const tel = document.getElementById('telephone');
        if (tel) {
            append('Testing hover on telephone...');
            tel.dispatchEvent(new Event('mouseenter', {bubbles:true}));
            await wait(250);
            append('  tooltip visible => ' + (document.getElementById('tooltip').style.display !== 'none'));
            tel.dispatchEvent(new Event('mouseleave', {bubbles:true}));
            await wait(120);
        }

        // Click sequence helper
        const clickAndCheck = async (id, desc) => {
            const el = document.getElementById(id);
            if (!el) { append(`Skipping ${desc} (${id}) - not found`); return; }
            append(`Clicking ${desc}...`);
            el.click();
            await wait(350);
            const visible = document.getElementById('action-modal').style.display !== 'none';
            append(`  action-modal visible => ${visible}`);
            // close if visible
            const ok = document.getElementById('action-ok-btn');
            if (ok && visible) { ok.click(); await wait(150); append('  closed action-modal'); }
        };

        await clickAndCheck('telephone', 'Telephone');
        await clickAndCheck('dossiers-stack', 'Dossiers Stack');
        await clickAndCheck('radio', 'Radio');
        await clickAndCheck('typewriter', 'Typewriter');
        await clickAndCheck('safe', 'Safe');

        // Next day
        const nd = document.getElementById('next-day-btn');
        if (nd) {
            append('Clicking NEXT DAY...');
            nd.click();
            await wait(250);
            const day = document.getElementById('day-counter') ? document.getElementById('day-counter').textContent : 'missing';
            append(`  day-counter => ${day}`);
        }

        append('AUTOTEST COMPLETE');
    })();
});