export function setupExpandableSection(sectionId: string, buttonId: string, onExpand?: () => void, onCollapse?: () => void) {
    const section = document.getElementById(sectionId);
    const button = document.getElementById(buttonId);

    if (!section || !button) return;

    let isExpanded = false;
    const originalClasses = section.className; // Save original classes

    // Icons
    const expandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize-2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`;
    const collapseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minimize-2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`;

    // Placeholder to prevent layout shift
    const placeholder = document.createElement('div');
    placeholder.className = 'hidden';
    section.parentNode?.insertBefore(placeholder, section);

    // Backdrop element
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 hidden transition-opacity opacity-0';
    document.body.appendChild(backdrop);

    const toggleExpand = () => {
        isExpanded = !isExpanded;

        if (isExpanded) {
            // -- EXPAND --

            // 1. Show Placeholder (occupy space)
            placeholder.style.height = `${section.offsetHeight}px`;
            placeholder.style.width = '100%';
            placeholder.classList.remove('hidden');

            // 2. Show Backdrop
            backdrop.classList.remove('hidden');
            // triggers reflow to enable transition
            requestAnimationFrame(() => {
                backdrop.classList.remove('opacity-0');
            });

            // 3. Style Section as Modal
            // We strip layout classes (col-span) and apply fixed centering
            section.className = 'fixed left-2 top-2 right-2 bottom-2 md:left-8 md:top-8 md:right-8 md:bottom-8 z-50 bg-white rounded-xl shadow-2xl flex flex-col p-6 md:p-8 border border-slate-200';

            // 4. Update Button
            button.innerHTML = collapseIcon;

            // 5. Lock Body Scroll
            document.body.style.overflow = 'hidden';

            if (onExpand) onExpand();

        } else {
            // -- COLLAPSE --

            // 1. Revert Section Classes
            section.className = originalClasses;

            // 2. Hide Backdrop
            backdrop.classList.add('opacity-0');
            setTimeout(() => {
                backdrop.classList.add('hidden');
            }, 300); // match transition duration

            // 3. Hide Placeholder
            placeholder.classList.add('hidden');

            // 4. Update Button
            button.innerHTML = expandIcon;

            // 5. Unlock Body Scroll
            document.body.style.overflow = '';

            if (onCollapse) onCollapse();
        }
    };

    button.addEventListener('click', toggleExpand);

    // Click on backdrop to close
    backdrop.addEventListener('click', () => {
        if (isExpanded) toggleExpand();
    });

    // Handle Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isExpanded) {
            toggleExpand();
        }
    });
}
